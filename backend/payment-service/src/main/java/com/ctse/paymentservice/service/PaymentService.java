package com.ctse.paymentservice.service;

import com.ctse.paymentservice.model.Payment;
import com.ctse.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public List<Payment> findAll() {
        return paymentRepository.findAll();
    }

    public Optional<Payment> findById(Long id) {
        return paymentRepository.findById(id);
    }

    public Optional<Payment> findByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId);
    }

    public Payment save(Payment payment) {
        return paymentRepository.save(payment);
    }

    public Optional<Payment> updateStatus(Long id, String status) {
        return paymentRepository.findById(id).map(existing -> {
            existing.setStatus(status);
            return paymentRepository.save(existing);
        });
    }

    public Optional<Payment> update(Long id, Payment updatedPayment) {
        return paymentRepository.findById(id).map(existing -> {
            existing.setOrderId(updatedPayment.getOrderId());
            existing.setAmount(updatedPayment.getAmount());
            existing.setPaymentMethod(updatedPayment.getPaymentMethod());
            existing.setStatus(updatedPayment.getStatus());
            return paymentRepository.save(existing);
        });
    }

    public boolean deleteById(Long id) {
        if (paymentRepository.existsById(id)) {
            paymentRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
