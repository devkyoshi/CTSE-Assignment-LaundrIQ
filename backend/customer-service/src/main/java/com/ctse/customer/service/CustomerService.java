package com.ctse.customer.service;

import com.ctse.common.exception.ResourceNotFoundException;
import com.ctse.customer.dto.*;
import com.ctse.customer.mapper.CustomerMapper;
import com.ctse.customer.model.Address;
import com.ctse.customer.model.CustomerPreferences;
import com.ctse.customer.repositary.AddressRepository;
import com.ctse.customer.repositary.CustomerPreferencesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final AddressRepository addressRepository;
    private final CustomerPreferencesRepository preferencesRepository;
    private final CustomerMapper customerMapper;

    // ==================== Profile Management ====================

    public ProfileResponse getProfile(String customerId) {
        log.info("Fetching profile for customer: {}", customerId);
        // Note: This would typically call Auth Service to get user details
        // For now, return a placeholder - would need Feign client to auth-service
        ProfileResponse response = new ProfileResponse();
        response.setId(customerId);
        // Would fetch from auth-service via REST call
        return response;
    }

    // ==================== Address Management ====================

    @Transactional
    public AddressDto addAddress(AddressRequest request) {
        log.info("Adding address for customer: {}", request.getCustomerId());

        if (request.getIsDefault() || isFirstAddress(request.getCustomerId())) {
            unsetDefaultAddress(request.getCustomerId());
            request.setIsDefault(true);
        }

        Address address = customerMapper.toEntity(request);
        Address saved = addressRepository.save(address);
        log.info("Address added successfully with id: {}", saved.getId());
        return customerMapper.toDto(saved);
    }

    public List<AddressDto> getAddresses(String customerId) {
        log.info("Fetching addresses for customer: {}", customerId);
        return addressRepository.findByCustomerId(customerId).stream()
                .map(customerMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AddressDto updateAddress(Long addressId, AddressRequest request) {
        log.info("Updating address with id: {}", addressId);

        Address existing = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));

        // Validate ownership
        if (!existing.getCustomerId().equals(request.getCustomerId())) {
            throw new RuntimeException("Address does not belong to this customer");
        }

        // Handle default address logic
        if (request.getIsDefault() && !existing.getIsDefault()) {
            unsetDefaultAddress(request.getCustomerId());
        }

        // Update fields
        existing.setAddressLine1(request.getAddressLine1());
        existing.setAddressLine2(request.getAddressLine2());
        existing.setCity(request.getCity());
        existing.setState(request.getState());
        existing.setPostalCode(request.getPostalCode());
        existing.setCountry(request.getCountry());
        existing.setPhoneNumber(request.getPhoneNumber());
        existing.setIsDefault(request.getIsDefault());
        existing.setAddressType(request.getAddressType());

        Address updated = addressRepository.save(existing);
        log.info("Address updated successfully");
        return customerMapper.toDto(updated);
    }

    @Transactional
    public void deleteAddress(Long addressId, String customerId) {
        log.info("Deleting address with id: {} for customer: {}", addressId, customerId);

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));

        if (!address.getCustomerId().equals(customerId)) {
            throw new RuntimeException("Address does not belong to this customer");
        }

        boolean wasDefault = address.getIsDefault();

        addressRepository.deleteById(addressId);
        log.info("Address deleted successfully");

        // If deleted address was default, set another address as default if exists
        if (wasDefault) {
            List<Address> remaining = addressRepository.findByCustomerId(customerId);
            if (!remaining.isEmpty()) {
                Address newDefault = remaining.get(0);
                newDefault.setIsDefault(true);
                addressRepository.save(newDefault);
                log.info("Set new default address: {}", newDefault.getId());
            }
        }
    }

    // ==================== Preferences Management ====================

    @Transactional
    public PreferencesDto setPreferences(String customerId, PreferencesDto preferencesDto) {
        log.info("Setting preferences for customer: {}", customerId);

        CustomerPreferences prefs = customerMapper.toEntity(customerId, preferencesDto);
        CustomerPreferences saved = preferencesRepository.save(prefs);
        log.info("Preferences saved successfully for customer: {}", customerId);
        return customerMapper.toDto(saved);
    }

    public PreferencesDto getPreferences(String customerId) {
        log.info("Fetching preferences for customer: {}", customerId);

        CustomerPreferences prefs = preferencesRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Preferences", "customerId", customerId));
        return customerMapper.toDto(prefs);
    }

    // ==================== Helper Methods ====================

    private boolean isFirstAddress(String customerId) {
        return addressRepository.findByCustomerId(customerId).isEmpty();
    }

    private void unsetDefaultAddress(String customerId) {
        addressRepository.findByCustomerIdAndIsDefaultTrue(customerId)
                .ifPresent(address -> {
                    address.setIsDefault(false);
                    addressRepository.save(address);
                });
    }
}