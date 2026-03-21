package com.ctse.customer.repositary;

import com.ctse.customer.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByCustomerId(String customerId);

    Optional<Address> findByCustomerIdAndIsDefaultTrue(String customerId);

    void deleteByCustomerIdAndId(String customerId, Long id);

    boolean existsByCustomerIdAndIsDefaultTrue(String customerId);
}