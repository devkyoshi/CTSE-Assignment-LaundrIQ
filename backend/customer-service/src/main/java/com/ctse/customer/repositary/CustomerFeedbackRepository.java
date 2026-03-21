package com.ctse.customer.repositary;

import com.ctse.customer.model.CustomerFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerFeedbackRepository extends JpaRepository<CustomerFeedback, Long> {

    Page<CustomerFeedback> findByCustomerIdOrderByCreatedAtDesc(String customerId, Pageable pageable);

    Optional<CustomerFeedback> findByOrderId(String orderId);

    boolean existsByOrderId(String orderId);

    // Average rating for a customer — useful for admin dashboards
    @Query("SELECT AVG(f.rating) FROM CustomerFeedback f WHERE f.customerId = :customerId")
    Double findAverageRatingByCustomerId(String customerId);
}