package com.ctse.customer.controller;

import com.ctse.common.response.ApiResponse;
import com.ctse.customer.dto.EarnPointsRequest;
import com.ctse.customer.dto.LoyaltyAccountDto;
import com.ctse.customer.dto.LoyaltyTransactionDto;
import com.ctse.customer.dto.RedeemPointsRequest;
import com.ctse.customer.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/customers/{customerId}/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping
    public ResponseEntity<ApiResponse<LoyaltyAccountDto>> getAccount(@PathVariable String customerId) {
        log.info("Received request to get loyalty account for customer: {}", customerId);
        LoyaltyAccountDto account = loyaltyService.getAccount(customerId);
        return ResponseEntity.ok(ApiResponse.success("Loyalty account retrieved successfully", account));
    }

    @PostMapping("/init")
    public ResponseEntity<ApiResponse<LoyaltyAccountDto>> createAccount(@PathVariable String customerId) {
        log.info("Received request to create loyalty account for customer: {}", customerId);
        LoyaltyAccountDto account = loyaltyService.createAccount(customerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Loyalty account created successfully", account));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<LoyaltyTransactionDto>>> getTransactions(
            @PathVariable String customerId,
            @PageableDefault(size = 10) Pageable pageable) {
        log.info("Received request to get transaction history for customer: {}", customerId);
        Page<LoyaltyTransactionDto> transactions = loyaltyService.getTransactionHistory(customerId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Transaction history retrieved successfully", transactions));
    }

    @PostMapping("/earn")
    public ResponseEntity<ApiResponse<LoyaltyAccountDto>> earnPoints(
            @PathVariable String customerId,
            @RequestBody EarnPointsRequest request) {
        log.info("Received request to earn points for customer: {}. Request: {}", customerId, request);
        request.setCustomerId(customerId);
        LoyaltyAccountDto account = loyaltyService.earnPoints(request);
        return ResponseEntity.ok(ApiResponse.success("Points earned successfully", account));
    }

    @PostMapping("/redeem")
    public ResponseEntity<ApiResponse<LoyaltyAccountDto>> redeemPoints(
            @PathVariable String customerId,
            @RequestBody RedeemPointsRequest request) {
        log.info("Received request to redeem points for customer: {}. Request: {}", customerId, request);
        request.setCustomerId(customerId);
        LoyaltyAccountDto account = loyaltyService.redeemPoints(request);
        return ResponseEntity.ok(ApiResponse.success("Points redeemed successfully", account));
    }
}