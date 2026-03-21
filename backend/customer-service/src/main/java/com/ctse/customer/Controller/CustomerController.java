package com.ctse.customer.Controller;


import com.ctse.common.response.ApiResponse;
import com.ctse.customer.dto.*;
import com.ctse.customer.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    // Profile Management
    @GetMapping("/{customerId}")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerProfile(@PathVariable String customerId) {
        log.info("Received request to get customer profile: {}", customerId);
        CustomerResponse customer = customerService.findByCustomerId(customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer profile retrieved successfully", customer));
    }

    @PutMapping("/{customerId}")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomerProfile(
            @PathVariable String customerId,
            @Valid @RequestBody CustomerRequest request) {
        log.info("Received request to update customer profile: {}", customerId);
        CustomerResponse updatedCustomer = customerService.updateCustomer(customerId, request);
        return ResponseEntity.ok(ApiResponse.success("Customer profile updated successfully", updatedCustomer));
    }

    @DeleteMapping("/{customerId}")
    public ResponseEntity<ApiResponse<Void>> deleteCustomerProfile(@PathVariable String customerId) {
        log.info("Received request to delete customer profile: {}", customerId);
        customerService.deleteCustomer(customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer profile deleted successfully"));
    }

    // Address Management
    @PostMapping("/{customerId}/addresses")
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(
            @PathVariable String customerId,
            @Valid @RequestBody AddressRequest request) {
        log.info("Received request to add address for customer: {}", customerId);
        AddressResponse address = customerService.addAddress(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Address added successfully", address));
    }

    @GetMapping("/{customerId}/addresses")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getAddresses(@PathVariable String customerId) {
        log.info("Received request to get addresses for customer: {}", customerId);
        List<AddressResponse> addresses = customerService.getAddresses(customerId);
        return ResponseEntity.ok(ApiResponse.success("Addresses retrieved successfully", addresses));
    }

    @PutMapping("/{customerId}/addresses/{addressId}")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable String customerId,
            @PathVariable Long addressId,
            @Valid @RequestBody AddressRequest request) {
        log.info("Received request to update address {} for customer: {}", addressId, customerId);
        AddressResponse updatedAddress = customerService.updateAddress(customerId, addressId, request);
        return ResponseEntity.ok(ApiResponse.success("Address updated successfully", updatedAddress));
    }

    @DeleteMapping("/{customerId}/addresses/{addressId}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable String customerId,
            @PathVariable Long addressId) {
        log.info("Received request to delete address {} for customer: {}", addressId, customerId);
        customerService.deleteAddress(customerId, addressId);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully"));
    }

    @PutMapping("/{customerId}/preferences")
    public ResponseEntity<ApiResponse<PreferencesResponse>> setPreferences(
            @PathVariable String customerId,
            @Valid @RequestBody PreferencesRequest request) {
        log.info("Received request to set preferences for customer: {}", customerId);
        PreferencesResponse preferences = customerService.setPreferences(customerId, request);
        return ResponseEntity.ok(ApiResponse.success("Preferences set successfully", preferences));
    }

    @GetMapping("/{customerId}/preferences")
    public ResponseEntity<ApiResponse<PreferencesResponse>> getPreferences(@PathVariable String customerId) {
        log.info("Received request to get preferences for customer: {}", customerId);
        PreferencesResponse preferences = customerService.getPreferences(customerId);
        return ResponseEntity.ok(ApiResponse.success("Preferences retrieved successfully", preferences));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> listCustomers() {
        log.info("Received request to list all customers");
        List<CustomerResponse> customers = customerService.findAll();
        return ResponseEntity.ok(ApiResponse.success("Customers retrieved successfully", customers));
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable String customerId) {
        log.info("Received request to get customer by id: {}", customerId);
        CustomerResponse customer = customerService.findByCustomerId(customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer retrieved successfully", customer));
    }
}