package com.ctse.customer.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "customer_feedback")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private String customerId;

    @Column(name = "order_id", nullable = false, unique = true)  // one review per order
    private String orderId;

    @Column(name = "rating", nullable = false)
    private Integer rating;   // 1–5

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private FeedbackCategory category;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "is_public")
    @Builder.Default
    private Boolean isPublic = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private FeedbackStatus status = FeedbackStatus.PENDING;

    @Column(name = "staff_response", columnDefinition = "TEXT")
    private String staffResponse;         // optional reply from laundry staff

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum FeedbackCategory {
        WASH_QUALITY,
        DELIVERY_TIME,
        PACKAGING,
        CUSTOMER_SERVICE,
        PRICING,
        OTHER
    }

    public enum FeedbackStatus {
        PENDING,
        REVIEWED,
        RESPONDED,
        FLAGGED
    }
}