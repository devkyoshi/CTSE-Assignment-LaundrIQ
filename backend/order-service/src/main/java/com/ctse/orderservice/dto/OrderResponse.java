package com.ctse.orderservice.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private Long id;
    private String customerId;
    private String serviceType;
    private Double weight;
    private Boolean isExpress;
    private Boolean isDryClean;
    private Double totalPrice;
    private String status;
    private TimeSlotDto pickupSlot;
    private TimeSlotDto deliverySlot;
    private List<OrderItemDto> items;
    private LocalDateTime createdAt;
}
