package com.ctse.customer.service;

import com.ctse.common.exception.ResourceNotFoundException;
import com.ctse.customer.dto.FeedbackDto;
import com.ctse.customer.dto.FeedbackRequest;
import com.ctse.customer.dto.FeedbackSummaryDto;
import com.ctse.customer.dto.FeedbackUpdateRequest;
import com.ctse.customer.model.CustomerFeedback;
import com.ctse.customer.model.CustomerFeedback.FeedbackStatus;
import com.ctse.customer.repositary.CustomerFeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private static final int COMMENT_SNIPPET_LENGTH = 100;

    private final CustomerFeedbackRepository feedbackRepository;

    // ──────────────────────────────────────────────────────────────
    //  Submit
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public FeedbackDto submitFeedback(FeedbackRequest request) {
        log.info("Submitting feedback for order: {} by customer: {}",
                request.getOrderId(), request.getCustomerId());

        // One review per order — prevent duplicates
        if (feedbackRepository.existsByOrderId(request.getOrderId())) {
            throw new IllegalStateException(
                    "Feedback already submitted for order: " + request.getOrderId());
        }

        CustomerFeedback feedback = CustomerFeedback.builder()
                .customerId(request.getCustomerId())
                .orderId(request.getOrderId())
                .rating(request.getRating())
                .category(request.getCategory())
                .comment(request.getComment())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .status(FeedbackStatus.PENDING)
                .build();

        CustomerFeedback saved = feedbackRepository.save(feedback);
        log.info("Feedback submitted with id: {}", saved.getId());
        return toDto(saved);
    }

    // ──────────────────────────────────────────────────────────────
    //  Read
    // ──────────────────────────────────────────────────────────────

    public FeedbackDto getFeedback(Long feedbackId, String customerId) {
        CustomerFeedback feedback = findAndValidateOwnership(feedbackId, customerId);
        return toDto(feedback);
    }

    public Page<FeedbackSummaryDto> getFeedbackHistory(String customerId, Pageable pageable) {
        log.info("Fetching feedback history for customer: {}", customerId);
        return feedbackRepository
                .findByCustomerIdOrderByCreatedAtDesc(customerId, pageable)
                .map(this::toSummaryDto);
    }

    public Double getAverageRating(String customerId) {
        log.info("Calculating average rating for customer: {}", customerId);
        Double avg = feedbackRepository.findAverageRatingByCustomerId(customerId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    // ──────────────────────────────────────────────────────────────
    //  Update (customer can edit before it's responded to)
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public FeedbackDto updateFeedback(Long feedbackId, String customerId, FeedbackUpdateRequest request) {
        log.info("Updating feedback id: {} for customer: {}", feedbackId, customerId);

        CustomerFeedback feedback = findAndValidateOwnership(feedbackId, customerId);

        if (feedback.getStatus() == FeedbackStatus.RESPONDED) {
            throw new IllegalStateException("Cannot edit feedback that has already received a staff response");
        }

        if (request.getRating() != null)     feedback.setRating(request.getRating());
        if (request.getCategory() != null)   feedback.setCategory(request.getCategory());
        if (request.getComment() != null)    feedback.setComment(request.getComment());
        if (request.getIsPublic() != null)   feedback.setIsPublic(request.getIsPublic());

        return toDto(feedbackRepository.save(feedback));
    }

    // ──────────────────────────────────────────────────────────────
    //  Delete
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public void deleteFeedback(Long feedbackId, String customerId) {
        log.info("Deleting feedback id: {} for customer: {}", feedbackId, customerId);

        CustomerFeedback feedback = findAndValidateOwnership(feedbackId, customerId);

        if (feedback.getStatus() == FeedbackStatus.RESPONDED) {
            throw new IllegalStateException("Cannot delete feedback that has a staff response");
        }

        feedbackRepository.deleteById(feedbackId);
        log.info("Feedback deleted successfully");
    }

    // ──────────────────────────────────────────────────────────────
    //  Staff response (internal — call from admin service or directly)
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public FeedbackDto addStaffResponse(Long feedbackId, String response) {
        log.info("Adding staff response to feedback id: {}", feedbackId);

        CustomerFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", feedbackId));

        feedback.setStaffResponse(response);
        feedback.setStatus(FeedbackStatus.RESPONDED);
        feedback.setRespondedAt(LocalDateTime.now());

        return toDto(feedbackRepository.save(feedback));
    }

    // ──────────────────────────────────────────────────────────────
    //  Private helpers
    // ──────────────────────────────────────────────────────────────

    private CustomerFeedback findAndValidateOwnership(Long feedbackId, String customerId) {
        CustomerFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", feedbackId));

        if (!feedback.getCustomerId().equals(customerId)) {
            throw new SecurityException("Feedback does not belong to this customer");
        }

        return feedback;
    }

    private FeedbackDto toDto(CustomerFeedback f) {
        return FeedbackDto.builder()
                .id(f.getId())
                .customerId(f.getCustomerId())
                .orderId(f.getOrderId())
                .rating(f.getRating())
                .category(f.getCategory())
                .comment(f.getComment())
                .isPublic(f.getIsPublic())
                .status(f.getStatus())
                .staffResponse(f.getStaffResponse())
                .respondedAt(f.getRespondedAt())
                .createdAt(f.getCreatedAt())
                .build();
    }

    private FeedbackSummaryDto toSummaryDto(CustomerFeedback f) {
        String snippet = f.getComment() != null && f.getComment().length() > COMMENT_SNIPPET_LENGTH
                ? f.getComment().substring(0, COMMENT_SNIPPET_LENGTH) + "..."
                : f.getComment();

        return FeedbackSummaryDto.builder()
                .id(f.getId())
                .orderId(f.getOrderId())
                .rating(f.getRating())
                .category(f.getCategory())
                .commentSnippet(snippet)
                .status(f.getStatus())
                .createdAt(f.getCreatedAt())
                .build();
    }
}