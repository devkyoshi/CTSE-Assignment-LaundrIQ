package com.ctse.paymentservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmPaymentRequest {

    @NotBlank(message = "Payment intent ID is required")
    private String paymentIntentId;
}
