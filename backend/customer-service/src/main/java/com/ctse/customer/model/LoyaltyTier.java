package com.ctse.customer.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LoyaltyTier {

    BRONZE(0, 499, 1.0),
    SILVER(500, 1499, 1.25),
    GOLD(1500, 2999, 1.5),
    PLATINUM(3000, Integer.MAX_VALUE, 2.0);

    private final int minPoints;
    private final int maxPoints;
    private final double multiplier;  // points multiplier for this tier

    public static LoyaltyTier fromLifetimePoints(int lifetimePoints) {
        for (LoyaltyTier tier : values()) {
            if (lifetimePoints >= tier.minPoints && lifetimePoints <= tier.maxPoints) {
                return tier;
            }
        }
        return BRONZE;
    }

    public int pointsToNextTier(int currentLifetimePoints) {
        if (this == PLATINUM) return 0;
        LoyaltyTier[] tiers = values();
        LoyaltyTier next = tiers[this.ordinal() + 1];
        return Math.max(0, next.minPoints - currentLifetimePoints);
    }
}