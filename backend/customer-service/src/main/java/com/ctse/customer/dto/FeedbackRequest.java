package com.ctse.customer.dto;

import com.ctse.customer.model.CustomerFeedback.FeedbackCategory;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequest {

    @NotBlank(message = "Customer ID is required")
    private String customerId;

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    private Integer rating;

    private FeedbackCategory category;

    @Size(max = 1000, message = "Comment cannot exceed 1000 characters")
    private String comment;

    private Boolean isPublic = true;
}