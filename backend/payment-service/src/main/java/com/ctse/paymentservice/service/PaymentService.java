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
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
                // Return existing pending payment (idempotent)
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
            try {
                // Stripe expects amount in smallest currency unit (cents)
                long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

                PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                        .setAmount(amountInCents)
                        .setCurrency("lkr")
                        .putMetadata("orderId", request.getOrderId().toString())
                        .putMetadata("customerId", request.getCustomerId())
                        .addPaymentMethodType("card")
                        .build();

                PaymentIntent intent = PaymentIntent.create(params);
                payment.setStripePaymentIntentId(intent.getId());
                payment.setStripeClientSecret(intent.getClientSecret());

            } catch (StripeException e) {
                log.error("Stripe PaymentIntent creation failed: {}", e.getMessage());
                throw new BadRequestException("Payment processing failed: " + e.getMessage());
            }
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
}
