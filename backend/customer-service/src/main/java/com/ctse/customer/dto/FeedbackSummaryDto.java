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
public class FeedbackSummaryDto {
    private Long id;
    private String orderId;
    private Integer rating;
    private FeedbackCategory category;
    private String commentSnippet;   // first 100 chars
    private FeedbackStatus status;
    private LocalDateTime createdAt;
}