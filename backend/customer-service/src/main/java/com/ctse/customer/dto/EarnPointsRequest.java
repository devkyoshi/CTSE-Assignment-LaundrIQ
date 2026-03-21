package com.ctse.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EarnPointsRequest {
    private String customerId;
    private Integer points;
    private String referenceId;  // orderId
    private String description;
}