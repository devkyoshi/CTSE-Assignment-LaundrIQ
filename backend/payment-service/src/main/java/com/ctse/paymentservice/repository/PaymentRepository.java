package com.ctse.paymentservice.repository;

import com.ctse.paymentservice.model.Payment;
import com.ctse.paymentservice.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(Long orderId);

    List<Payment> findByStatus(PaymentStatus status);

    List<Payment> findByCustomerId(String customerId);

    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);
}
