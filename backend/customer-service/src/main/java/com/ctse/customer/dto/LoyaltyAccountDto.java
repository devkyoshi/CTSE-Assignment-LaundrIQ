package com.ctse.customer.dto;

import com.ctse.customer.model.LoyaltyTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyAccountDto {
    private Long id;
    private String customerId;
    private Integer totalPoints;
    private Integer lifetimePoints;
    private LoyaltyTier tier;
    private Double tierMultiplier;
    private Integer pointsToNextTier;   // 0 if PLATINUM
    private LocalDateTime updatedAt;
}