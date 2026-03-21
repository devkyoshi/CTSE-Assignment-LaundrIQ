package com.ctse.orderservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderItemDto {

    @NotBlank(message = "Item name is required")
    private String name;

    @NotNull(message = "Item quantity is required")
    @Min(value = 1, message = "Item quantity must be at least 1")
    private Integer quantity;

    @NotNull(message = "Item unit price is required")
    @Min(value = 0, message = "Item unit price must be positive")
    private Double unitPrice;
}
