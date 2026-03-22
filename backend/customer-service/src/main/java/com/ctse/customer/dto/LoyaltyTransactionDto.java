package com.ctse.customer.dto;

import com.ctse.customer.model.LoyaltyTransaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyTransactionDto {
    private Long id;
    private Integer points;
    private LoyaltyTransaction.TransactionType type;
    private String description;
    private String referenceId;
    private Integer balanceAfter;
    private LocalDateTime createdAt;
}