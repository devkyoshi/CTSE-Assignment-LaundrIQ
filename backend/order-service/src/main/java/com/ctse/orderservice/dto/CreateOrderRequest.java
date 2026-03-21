package com.ctse.orderservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {

    @NotBlank(message = "Customer ID is required")
    private String customerId;

    @NotBlank(message = "Service type is required (STANDARD or PREMIUM)")
    private String serviceType;

    private Double weight;

    @NotNull(message = "isExpress flag is required")
    private Boolean isExpress;

    @NotNull(message = "isDryClean flag is required")
    private Boolean isDryClean;

    @NotNull(message = "Total price is required")
    private Double totalPrice;

    @Valid
    private TimeSlotDto pickupSlot;

    @Valid
    private TimeSlotDto deliverySlot;

    @Valid
    private List<OrderItemDto> items;
}
