package com.ctse.customer.dto;

import com.ctse.customer.model.CustomerFeedback.FeedbackCategory;
import com.ctse.customer.model.CustomerFeedback.FeedbackStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDto {
    private Long id;
    private String customerId;
    private String orderId;
    private Integer rating;
    private FeedbackCategory category;
    private String comment;
    private Boolean isPublic;
    private FeedbackStatus status;
    private String staffResponse;
    private LocalDateTime respondedAt;
    private LocalDateTime createdAt;

}