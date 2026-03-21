package com.ctse.orderservice.controller;

import com.ctse.common.response.ApiResponse;
import com.ctse.orderservice.service.PricingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/orders/pricing")
@RequiredArgsConstructor
@Slf4j
public class PricingController {
    
    private final PricingService pricingService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Double>>> getPricingRules() {
        log.info("Fetching all pricing rules");
        return ResponseEntity.ok(ApiResponse.success("Pricing rules fetched successfully", pricingService.getAllPricingRules()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Map<String, Double>>> updatePricingRules(@RequestBody Map<String, Double> rules) {
        log.info("Updating pricing rules");
        Map<String, Double> updatedRules = pricingService.updatePricingRules(rules);
        return ResponseEntity.ok(ApiResponse.success("Pricing rules updated successfully", updatedRules));
    }
}
