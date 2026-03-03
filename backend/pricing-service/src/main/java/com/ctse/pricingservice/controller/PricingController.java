package com.ctse.pricingservice.controller;

import com.ctse.common.response.ApiResponse;
import com.ctse.pricingservice.dto.PriceCatalogueRequest;
import com.ctse.pricingservice.model.PriceCatalogue;
import com.ctse.pricingservice.service.PricingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PriceCatalogue>>> getAll(
            @RequestParam(required = false) String serviceType) {
        List<PriceCatalogue> data = (serviceType != null)
                ? pricingService.findByServiceType(serviceType)
                : pricingService.findAll();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PriceCatalogue>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(pricingService.findById(id)));
    }

    @GetMapping("/calculate")
    public ResponseEntity<ApiResponse<Double>> calculate(
            @RequestParam String serviceType,
            @RequestParam String itemType,
            @RequestParam(defaultValue = "1") int quantity) {
        double total = pricingService.calculatePrice(serviceType, itemType, quantity);
        return ResponseEntity.ok(ApiResponse.success(
                String.format("Total price for %d x %s/%s", quantity, serviceType, itemType), total));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PriceCatalogue>> create(
            @Valid @RequestBody PriceCatalogueRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Price entry created", pricingService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PriceCatalogue>> update(
            @PathVariable Long id,
            @Valid @RequestBody PriceCatalogueRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Price entry updated", pricingService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        pricingService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Price entry deleted"));
    }
}
