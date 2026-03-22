package com.ctse.customer.dto;

import com.ctse.customer.model.CustomerFeedback.FeedbackCategory;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackUpdateRequest {

    @Min(1) @Max(5)
    private Integer rating;

    private FeedbackCategory category;

    @Size(max = 1000)
    private String comment;

    private Boolean isPublic;
}