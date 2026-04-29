package com.ctse.paymentservice.service;

import com.ctse.common.exception.BadRequestException;
import com.ctse.common.exception.ConflictException;
import com.ctse.common.exception.ResourceNotFoundException;
import com.ctse.paymentservice.client.OrderInfo;
import com.ctse.paymentservice.client.OrderServiceClient;
import com.ctse.paymentservice.dto.ConfirmPaymentRequest;
import com.ctse.paymentservice.dto.CreatePaymentRequest;
import com.ctse.paymentservice.dto.PaymentResponse;
import com.ctse.paymentservice.mapper.PaymentMapper;
import com.ctse.paymentservice.model.Payment;
import com.ctse.paymentservice.model.PaymentMethod;
import com.ctse.paymentservice.model.PaymentStatus;
import com.ctse.paymentservice.repository.PaymentRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderServiceClient orderServiceClient;
    private final PaymentMapper paymentMapper;

    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        // 1. Validate order exists and get totalPrice
        OrderInfo orderInfo = orderServiceClient.getOrder(request.getOrderId());

        // 2. Check for duplicate payments
        Optional<Payment> existing = paymentRepository.findByOrderId(request.getOrderId());
        if (existing.isPresent()) {
            Payment existingPayment = existing.get();
            if (existingPayment.getStatus() == PaymentStatus.COMPLETED) {
                throw new ConflictException("Payment already completed for order: " + request.getOrderId());
            }
            if (existingPayment.getStatus() == PaymentStatus.PENDING) {
                // For pending card payments, ensure a fresh client secret is returned.
                if (existingPayment.getPaymentMethod() != PaymentMethod.CASH_ON_DELIVERY) {
                    PaymentIntent intent = createPaymentIntent(
                            request.getOrderId(),
                            request.getCustomerId(),
                            existingPayment.getAmount()
                    );
                    existingPayment.setStripePaymentIntentId(intent.getId());
                    existingPayment.setStripeClientSecret(intent.getClientSecret());
                    existingPayment = paymentRepository.save(existingPayment);
                }

                return paymentMapper.toDto(existingPayment);
            }
        }

        // 3. Get amount from order (never trust client)
        BigDecimal amount = BigDecimal.valueOf(orderInfo.getTotalPrice()).setScale(2, RoundingMode.HALF_UP);

        // 4. Create payment entity
        Payment payment = new Payment();
        payment.setOrderId(request.getOrderId());
        payment.setCustomerId(request.getCustomerId());
        payment.setAmount(amount);
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setStatus(PaymentStatus.PENDING);

        // 5. For card payments, create Stripe PaymentIntent
        if (request.getPaymentMethod() != PaymentMethod.CASH_ON_DELIVERY) {
            PaymentIntent intent = createPaymentIntent(request.getOrderId(), request.getCustomerId(), amount);
            payment.setStripePaymentIntentId(intent.getId());
            payment.setStripeClientSecret(intent.getClientSecret());
        }

        Payment saved = paymentRepository.save(payment);
        // Preserve transient field
        saved.setStripeClientSecret(payment.getStripeClientSecret());

        return paymentMapper.toDto(saved);
    }

    @Transactional
    public PaymentResponse confirmPayment(ConfirmPaymentRequest request) {
        // 1. Find local payment by Stripe PaymentIntent ID
        Payment payment = paymentRepository.findByStripePaymentIntentId(request.getPaymentIntentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found for intent: " + request.getPaymentIntentId()));

        // 2. Retrieve Stripe PaymentIntent to check actual status
        try {
            PaymentIntent intent = PaymentIntent.retrieve(request.getPaymentIntentId());

            if ("succeeded".equals(intent.getStatus())) {
                payment.setStatus(PaymentStatus.COMPLETED);
                paymentRepository.save(payment);

                // Update order status
                orderServiceClient.updateOrderStatus(payment.getOrderId(), "CONFIRMED");
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
            }
        } catch (StripeException e) {
            log.error("Failed to retrieve PaymentIntent {}: {}", request.getPaymentIntentId(), e.getMessage());
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }

        return paymentMapper.toDto(payment);
    }

    private PaymentIntent createPaymentIntent(Long orderId, String customerId, BigDecimal amount) {
        try {
            // Stripe expects amount in smallest currency unit (cents)
            long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency("lkr")
                    .putMetadata("orderId", orderId.toString())
                    .putMetadata("customerId", customerId)
                    .addPaymentMethodType("card")
                    .build();

            return PaymentIntent.create(params);
        } catch (StripeException e) {
            log.error("Stripe PaymentIntent creation failed for order {}: {}", orderId, e.getMessage());
            throw new BadRequestException("Payment processing failed: " + e.getMessage());
        }
    }

    public List<PaymentResponse> findAll() {
        return paymentRepository.findAll().stream()
                .map(paymentMapper::toDto)
                .toList();
    }

    public PaymentResponse findById(Long id) {
        return paymentRepository.findById(id)
                .map(paymentMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id));
    }

    public PaymentResponse findByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId)
                .map(paymentMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order: " + orderId));
    }

    public List<PaymentResponse> findByCustomerId(String customerId) {
        return paymentRepository.findByCustomerId(customerId).stream()
                .map(paymentMapper::toDto)
                .toList();
    }

    @Transactional
    public PaymentResponse refundPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));

        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new ConflictException("Payment is already refunded");
        }
        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new ConflictException("Only completed payments can be refunded");
        }

        OrderInfo orderInfo = orderServiceClient.getOrder(payment.getOrderId());
        validateRefundWindow(orderInfo);

        if (payment.getPaymentMethod() != PaymentMethod.CASH_ON_DELIVERY && payment.getStripePaymentIntentId() != null) {
            refundStripePayment(payment.getStripePaymentIntentId());
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);
        orderServiceClient.updateOrderStatus(payment.getOrderId(), "CANCELLED");

        return paymentMapper.toDto(payment);
    }

    private void validateRefundWindow(OrderInfo orderInfo) {
        if (orderInfo.getPickupDate() == null || orderInfo.getPickupDate().isBlank()) {
            throw new BadRequestException("Pickup date is required for refund eligibility");
        }

        try {
            LocalDate pickupDate = LocalDate.parse(orderInfo.getPickupDate());
            if (!LocalDate.now().isBefore(pickupDate)) {
                throw new ConflictException("Refund is allowed only before the pickup date");
            }
        } catch (DateTimeParseException ex) {
            throw new BadRequestException("Invalid pickup date format for refund eligibility");
        }
    }

    private void refundStripePayment(String paymentIntentId) {
        try {
            RefundCreateParams params = RefundCreateParams.builder()
                    .setPaymentIntent(paymentIntentId)
                    .build();
            Refund.create(params);
        } catch (StripeException e) {
            log.error("Stripe refund failed for payment intent {}: {}", paymentIntentId, e.getMessage());
            throw new BadRequestException("Refund processing failed: " + e.getMessage());
        }
    }
}
