package com.ctse.pricingservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PriceCatalogueRequest {

    @NotBlank(message = "Service type is required")
    private String serviceType;

    @NotBlank(message = "Item type is required")
    private String itemType;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", message = "Unit price must be non-negative")
    private Double unitPrice;

    private String currency = "USD";
}
