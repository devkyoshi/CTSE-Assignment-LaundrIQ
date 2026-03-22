package com.ctse.customer.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "customer_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerPreferences {

    @Id
    private String customerId;  // References User.id from auth service

    @Column(nullable = false)
    private String preferredLanguage = "en";

    @Column(nullable = false)
    private Boolean emailNotifications = true;

    @Column(nullable = false)
    private Boolean smsNotifications = false;

    private String preferredPaymentMethod; // CARD, CASH, etc.

    private String preferredServiceType; // STANDARD, PREMIUM

    private Boolean isExpressPreferred = false;

    private Boolean isDryCleanPreferred = false;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}