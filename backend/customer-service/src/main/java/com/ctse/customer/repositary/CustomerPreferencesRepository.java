package com.ctse.customer.repositary;

import com.ctse.customer.model.CustomerPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerPreferencesRepository extends JpaRepository<CustomerPreferences, String> {
    Optional<CustomerPreferences> findByCustomerId(String customerId);
}