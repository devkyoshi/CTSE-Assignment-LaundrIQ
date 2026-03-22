package com.ctse.customer.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_transactions")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private String customerId;

    @Column(name = "points", nullable = false)
    private Integer points;   // positive = earned, negative = redeemed/expired

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TransactionType type;

    @Column(name = "description")
    private String description;

    @Column(name = "reference_id")
    private String referenceId;   // e.g. orderId that triggered the transaction

    @Column(name = "balance_after", nullable = false)
    private Integer balanceAfter;  // snapshot of balance after this transaction

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum TransactionType {
        EARNED,       // from completing an order
        REDEEMED,     // used for a discount
        BONUS,        // manual bonus from admin / promotion
        EXPIRED,      // periodic expiry
        ADJUSTED      // manual correction
    }
}