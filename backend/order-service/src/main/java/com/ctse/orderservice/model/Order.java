package com.ctse.orderservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerId;

    @Column(nullable = false)
    private String serviceType;

    @Column
    private Double weight;

    @Column(nullable = false)
    private Boolean isExpress = false;

    @Column(nullable = false)
    private Boolean isDryClean = false;

    @Column(nullable = false)
    private Double totalPrice;

    @Column(nullable = false)
    private String status;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "date", column = @Column(name = "pickup_date")),
            @AttributeOverride(name = "time", column = @Column(name = "pickup_time"))
    })
    private TimeSlot pickupSlot;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "date", column = @Column(name = "delivery_date")),
            @AttributeOverride(name = "time", column = @Column(name = "delivery_time"))
    })
    private TimeSlot deliverySlot;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
        if (items != null) {
            items.forEach(item -> item.setOrder(this));
        }
    }
}
