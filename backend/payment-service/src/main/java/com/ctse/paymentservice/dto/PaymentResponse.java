package com.ctse.paymentservice.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private String customerId;
    private BigDecimal amount;
    private String paymentMethod;
    private String status;
    private String stripePaymentIntentId;
    private String stripeClientSecret;
    private LocalDateTime createdAt;
}
