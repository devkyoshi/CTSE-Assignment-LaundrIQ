package com.ctse.customer.controller;

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

    // ==================== Profile Management ====================

    @GetMapping("/{customerId}/profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile(@PathVariable String customerId) {
        log.info("Received request to get profile for customer: {}", customerId);
        ProfileResponse profile = customerService.getProfile(customerId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    // ==================== Address Management ====================

    @PostMapping("/addresses")
    public ResponseEntity<ApiResponse<AddressDto>> addAddress(@Valid @RequestBody AddressRequest request) {
        log.info("Received request to add address for customer: {}", request.getCustomerId());
        AddressDto address = customerService.addAddress(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Address added successfully", address));
    }

    @GetMapping("/{customerId}/addresses")
    public ResponseEntity<ApiResponse<List<AddressDto>>> getAddresses(@PathVariable String customerId) {
        log.info("Received request to get addresses for customer: {}", customerId);
        List<AddressDto> addresses = customerService.getAddresses(customerId);
        return ResponseEntity.ok(ApiResponse.success("Addresses retrieved successfully", addresses));
    }

    @PutMapping("/addresses/{addressId}")
    public ResponseEntity<ApiResponse<AddressDto>> updateAddress(
            @PathVariable Long addressId,
            @Valid @RequestBody AddressRequest request) {
        log.info("Received request to update address with id: {}", addressId);
        AddressDto address = customerService.updateAddress(addressId, request);
        return ResponseEntity.ok(ApiResponse.success("Address updated successfully", address));
    }

    @DeleteMapping("/addresses/{addressId}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Long addressId,
            @RequestParam String customerId) {
        log.info("Received request to delete address with id: {} for customer: {}", addressId, customerId);
        customerService.deleteAddress(addressId, customerId);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully"));
    }

    // ==================== Preferences Management ====================

    @PutMapping("/{customerId}/preferences")
    public ResponseEntity<ApiResponse<PreferencesDto>> setPreferences(
            @PathVariable String customerId,
            @Valid @RequestBody PreferencesDto preferencesDto) {
        log.info("Received request to set preferences for customer: {}", customerId);
        PreferencesDto preferences = customerService.setPreferences(customerId, preferencesDto);
        return ResponseEntity.ok(ApiResponse.success("Preferences saved successfully", preferences));
    }

    @GetMapping("/{customerId}/preferences")
    public ResponseEntity<ApiResponse<PreferencesDto>> getPreferences(@PathVariable String customerId) {
        log.info("Received request to get preferences for customer: {}", customerId);
        PreferencesDto preferences = customerService.getPreferences(customerId);
        return ResponseEntity.ok(ApiResponse.success("Preferences retrieved successfully", preferences));
    }
}