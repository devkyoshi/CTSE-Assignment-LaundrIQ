package com.ctse.customer.repositary;

import com.ctse.customer.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByCustomerId(String customerId);
    boolean existsByCustomerId(String customerId);
    boolean existsByEmail(String email);
}

