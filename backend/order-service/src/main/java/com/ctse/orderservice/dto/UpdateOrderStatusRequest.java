package com.ctse.orderservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateOrderStatusRequest {
    @NotBlank(message = "Status cannot be blank")
    private String status;
}
