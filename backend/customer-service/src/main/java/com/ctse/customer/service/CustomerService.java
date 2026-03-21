package com.ctse.customer.service;

import com.ctse.customer.dto.*;
import com.ctse.customer.mapper.CustomerMapper;
import com.ctse.customer.model.Address;
import com.ctse.customer.model.Customer;
import com.ctse.customer.model.Preferences;
import com.ctse.customer.repositary.AddressRepository;
import com.ctse.customer.repositary.CustomerRepository;
import com.ctse.customer.repositary.PreferencesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final AddressRepository addressRepository;
    private final PreferencesRepository preferencesRepository;
    private final CustomerMapper customerMapper;

    // Profile Management
    public CustomerResponse findByCustomerId(String customerId) {
        log.info("Fetching customer with customerId: {}", customerId);
        Customer customer = customerRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "customerId", customerId));
        return customerMapper.toDto(customer);
    }

    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        log.info("Creating new customer with email: {}", request.getEmail());

        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        String customerId = "CUST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Customer customer = customerMapper.toEntity(request, customerId);
        Customer savedCustomer = customerRepository.save(customer);
        log.info("Customer created successfully with customerId: {}", savedCustomer.getCustomerId());
        return customerMapper.toDto(savedCustomer);
    }

    @Transactional
    public CustomerResponse updateCustomer(String customerId, CustomerRequest request) {
        log.info("Updating customer: {}", customerId);
        Customer existing = customerRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "customerId", customerId));

        existing.setName(request.getName());
        existing.setEmail(request.getEmail());
        existing.setPhoneNumber(request.getPhoneNumber());

        Customer updated = customerRepository.save(existing);
        log.info("Customer updated successfully: {}", customerId);
        return customerMapper.toDto(updated);
    }

    @Transactional
    public void deleteCustomer(String customerId) {
        log.info("Deleting customer: {}", customerId);
        Customer customer = customerRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "customerId", customerId));
        customerRepository.delete(customer);
        log.info("Customer deleted successfully: {}", customerId);
    }

    // Address Management
    @Transactional
    public AddressResponse addAddress(String customerId, AddressRequest request) {
        log.info("Adding address for customer: {}", customerId);
        Customer customer = customerRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "customerId", customerId));

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.findByCustomerCustomerId(customerId)
                    .forEach(address -> address.setIsDefault(false));
        }

        Address address = customerMapper.toEntity(request, customer);
        Address savedAddress = addressRepository.save(address);
        log.info("Address added successfully with id: {}", savedAddress.getId());
        return customerMapper.toDto(savedAddress);
    }

    public List<AddressResponse> getAddresses(String customerId) {
        log.info("Fetching addresses for customer: {}", customerId);
        if (!customerRepository.existsByCustomerId(customerId)) {
            throw new ResourceNotFoundException("Customer", "customerId", customerId);
        }
        return addressRepository.findByCustomerCustomerId(customerId).stream()
                .map(customerMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AddressResponse updateAddress(String customerId, Long addressId, AddressRequest request) {
        log.info("Updating address {} for customer: {}", addressId, customerId);
        Address address = addressRepository.findByIdAndCustomerCustomerId(addressId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));

        address.setAddressLine(request.getAddressLine());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        address.setCountry(request.getCountry());

        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            addressRepository.findByCustomerCustomerId(customerId)
                    .forEach(addr -> addr.setIsDefault(false));
            address.setIsDefault(true);
        }

        Address updated = addressRepository.save(address);
        log.info("Address updated successfully");
        return customerMapper.toDto(updated);
    }

    @Transactional
    public void deleteAddress(String customerId, Long addressId) {
        log.info("Deleting address {} for customer: {}", addressId, customerId);
        Address address = addressRepository.findByIdAndCustomerCustomerId(addressId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));
        addressRepository.delete(address);
        log.info("Address deleted successfully");
    }

    // Preferences Management
    @Transactional
    public PreferencesResponse setPreferences(String customerId, PreferencesRequest request) {
        log.info("Setting preferences for customer: {}", customerId);
        Customer customer = customerRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "customerId", customerId));

        Preferences preferences = preferencesRepository.findByCustomerCustomerId(customerId)
                .orElse(null);

        if (preferences == null) {
            preferences = customerMapper.toEntity(request, customer);
        } else {
            preferences.setEmailNotifications(request.getEmailNotifications());
            preferences.setSmsNotifications(request.getSmsNotifications());
            preferences.setPreferredLanguage(request.getPreferredLanguage());
            preferences.setPreferredPaymentMethod(request.getPreferredPaymentMethod());
            preferences.setPreferredServiceType(request.getPreferredServiceType());
        }

        Preferences saved = preferencesRepository.save(preferences);
        log.info("Preferences saved successfully for customer: {}", customerId);
        return customerMapper.toDto(saved);
    }

    public PreferencesResponse getPreferences(String customerId) {
        log.info("Fetching preferences for customer: {}", customerId);
        Preferences preferences = preferencesRepository.findByCustomerCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Preferences", "customerId", customerId));
        return customerMapper.toDto(preferences);
    }
}