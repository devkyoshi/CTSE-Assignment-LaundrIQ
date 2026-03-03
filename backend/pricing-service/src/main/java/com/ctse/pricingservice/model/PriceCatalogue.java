package com.ctse.pricingservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.Instant;

/**
 * Represents a unit price entry for a specific laundry service + item type combination.
 */
@Entity
@Table(
    name = "price_catalogue",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_service_item",
        columnNames = {"service_type", "item_type"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceCatalogue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** e.g. WASH, DRY_CLEAN, IRON, WASH_AND_FOLD */
    @NotBlank
    @Column(name = "service_type", nullable = false, length = 50)
    private String serviceType;

    /** e.g. SHIRT, TROUSER, JACKET, BED_SHEET */
    @NotBlank
    @Column(name = "item_type", nullable = false, length = 50)
    private String itemType;

    @NotNull
    @DecimalMin("0.0")
    @Column(name = "unit_price", nullable = false)
    private Double unitPrice;

    /** ISO-4217 currency code – default USD */
    @NotBlank
    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "USD";

    @Column(updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant updatedAt;

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
