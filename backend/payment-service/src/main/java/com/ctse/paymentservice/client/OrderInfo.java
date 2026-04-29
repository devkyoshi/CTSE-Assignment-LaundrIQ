package com.ctse.paymentservice.client;

import lombok.Data;

@Data
public class OrderInfo {
    private Long id;
    private String customerId;
    private Double totalPrice;
    private String status;
    private String pickupDate;
}
