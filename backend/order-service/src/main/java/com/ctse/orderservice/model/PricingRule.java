package com.ctse.orderservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pricing_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PricingRule {
    @Id
    @Column(name = "rule_key", nullable = false, unique = true)
    private String key;

    @Column(nullable = false)
    private Double value;
}
