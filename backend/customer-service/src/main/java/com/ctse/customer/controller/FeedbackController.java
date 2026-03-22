package com.ctse.customer.controller;

import com.ctse.common.response.ApiResponse;
import com.ctse.customer.dto.FeedbackDto;
import com.ctse.customer.dto.FeedbackRequest;
import com.ctse.customer.dto.FeedbackSummaryDto;
import com.ctse.customer.dto.FeedbackUpdateRequest;
import com.ctse.customer.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/customers/{customerId}/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<ApiResponse<FeedbackDto>> submitFeedback(
            @PathVariable String customerId,
            @Valid @RequestBody FeedbackRequest request) {
        log.info("Received request to submit feedback for customer: {}", customerId);
        request.setCustomerId(customerId);
        FeedbackDto feedback = feedbackService.submitFeedback(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Feedback submitted successfully", feedback));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<FeedbackSummaryDto>>> getFeedbackHistory(
            @PathVariable String customerId,
            @PageableDefault(size = 10) Pageable pageable) {
        log.info("Received request to get feedback history for customer: {}", customerId);
        Page<FeedbackSummaryDto> feedbackHistory = feedbackService.getFeedbackHistory(customerId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Feedback history retrieved successfully", feedbackHistory));
    }

    @GetMapping("/{feedbackId}")
    public ResponseEntity<ApiResponse<FeedbackDto>> getFeedback(
            @PathVariable String customerId,
            @PathVariable Long feedbackId) {
        log.info("Received request to get feedback with id: {} for customer: {}", feedbackId, customerId);
        FeedbackDto feedback = feedbackService.getFeedback(feedbackId, customerId);
        return ResponseEntity.ok(ApiResponse.success("Feedback retrieved successfully", feedback));
    }

    @PatchMapping("/{feedbackId}")
    public ResponseEntity<ApiResponse<FeedbackDto>> updateFeedback(
            @PathVariable String customerId,
            @PathVariable Long feedbackId,
            @Valid @RequestBody FeedbackUpdateRequest request) {
        log.info("Received request to update feedback with id: {} for customer: {}", feedbackId, customerId);
        FeedbackDto updatedFeedback = feedbackService.updateFeedback(feedbackId, customerId, request);
        return ResponseEntity.ok(ApiResponse.success("Feedback updated successfully", updatedFeedback));
    }

    @DeleteMapping("/{feedbackId}")
    public ResponseEntity<ApiResponse<Void>> deleteFeedback(
            @PathVariable String customerId,
            @PathVariable Long feedbackId) {
        log.info("Received request to delete feedback with id: {} for customer: {}", feedbackId, customerId);
        feedbackService.deleteFeedback(feedbackId, customerId);
        return ResponseEntity.ok(ApiResponse.success("Feedback deleted successfully"));
    }

    @GetMapping("/average-rating")
    public ResponseEntity<ApiResponse<Map<String, Double>>> getAverageRating(@PathVariable String customerId) {
        log.info("Received request to get average rating for customer: {}", customerId);
        Double avg = feedbackService.getAverageRating(customerId);
        Map<String, Double> response = Map.of("averageRating", avg);
        return ResponseEntity.ok(ApiResponse.success("Average rating retrieved successfully", response));
    }
}