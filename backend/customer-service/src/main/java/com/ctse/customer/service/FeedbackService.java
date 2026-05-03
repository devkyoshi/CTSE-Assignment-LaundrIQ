package com.ctse.customer.service;

import com.ctse.common.exception.ResourceNotFoundException;
import com.ctse.customer.dto.FeedbackDto;
import com.ctse.customer.dto.FeedbackRequest;
import com.ctse.customer.dto.FeedbackSummaryDto;
import com.ctse.customer.dto.FeedbackUpdateRequest;
import com.ctse.customer.client.OrderRestClient;
import com.ctse.customer.grpc.client.OrderGrpcClient;
import com.ctse.customer.model.CustomerFeedback;
import com.ctse.customer.model.CustomerFeedback.FeedbackStatus;
import com.ctse.customer.repositary.CustomerFeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ctse.grpc.order.GetOrderSummaryResponse;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private static final int COMMENT_SNIPPET_LENGTH = 100;

    private final CustomerFeedbackRepository feedbackRepository;
    private final OrderRestClient orderRestClient;
    private final OrderGrpcClient orderGrpcClient;

    // ──────────────────────────────────────────────────────────────
    //  Submit
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public FeedbackDto submitFeedback(FeedbackRequest request) {
        log.info("Submitting feedback for order: {} by customer: {}",
                request.getOrderId(), request.getCustomerId());

        // Validate that the order exists and belongs to the customer (order-service REST API)
        boolean isValidOrder = orderRestClient.validateOrderOwnership(
                request.getOrderId(),
                request.getCustomerId()
        );

        if (!isValidOrder) {
            throw new IllegalArgumentException(
                    "Invalid order: Order " + request.getOrderId() +
                            " does not exist or does not belong to customer " + request.getCustomerId()
            );
        }

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

        // Fetch order details for the response
        GetOrderSummaryResponse orderSummary = orderGrpcClient.getOrderSummary(saved.getOrderId());
        return toDtoWithOrderDetails(saved, orderSummary);
    }

    // ──────────────────────────────────────────────────────────────
    //  Read
    // ──────────────────────────────────────────────────────────────

    public FeedbackDto getFeedback(Long feedbackId, String customerId) {
        CustomerFeedback feedback = findAndValidateOwnership(feedbackId, customerId);

        GetOrderSummaryResponse orderSummary = orderGrpcClient.getOrderSummary(feedback.getOrderId());

        return toDtoWithOrderDetails(feedback, orderSummary);
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
    //  Update
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

        CustomerFeedback updated = feedbackRepository.save(feedback);

        // Fetch order details for the response
        GetOrderSummaryResponse orderSummary = orderGrpcClient.getOrderSummary(updated.getOrderId());
        return toDtoWithOrderDetails(updated, orderSummary);
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
    //  Staff response
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public FeedbackDto addStaffResponse(Long feedbackId, String response) {
        log.info("Adding staff response to feedback id: {}", feedbackId);

        CustomerFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", feedbackId));

        feedback.setStaffResponse(response);
        feedback.setStatus(FeedbackStatus.RESPONDED);
        feedback.setRespondedAt(LocalDateTime.now());

        CustomerFeedback updated = feedbackRepository.save(feedback);

        // Fetch order details for the response
        GetOrderSummaryResponse orderSummary = orderGrpcClient.getOrderSummary(updated.getOrderId());
        return toDtoWithOrderDetails(updated, orderSummary);
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

    /**
     * Convert CustomerFeedback to FeedbackDto without order details
     */
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

    /**
     * Convert CustomerFeedback to FeedbackDto with order details
     */
    private FeedbackDto toDtoWithOrderDetails(CustomerFeedback feedback, GetOrderSummaryResponse orderSummary) {
        FeedbackDto.FeedbackDtoBuilder builder = FeedbackDto.builder()
                .id(feedback.getId())
                .customerId(feedback.getCustomerId())
                .orderId(feedback.getOrderId())
                .rating(feedback.getRating())
                .category(feedback.getCategory())
                .comment(feedback.getComment())
                .isPublic(feedback.getIsPublic())
                .status(feedback.getStatus())
                .staffResponse(feedback.getStaffResponse())
                .respondedAt(feedback.getRespondedAt())
                .createdAt(feedback.getCreatedAt());

        // Add order details if available
        if (orderSummary != null) {
            builder.orderStatus(orderSummary.getStatus())
                    .orderTotalAmount(orderSummary.getTotalAmount())
                    .orderCurrency(orderSummary.getCurrency())
                    .orderCustomerId(orderSummary.getCustomerId());

            log.debug("Added order details - Status: {}, Amount: {} {}",
                    orderSummary.getStatus(),
                    orderSummary.getTotalAmount(),
                    orderSummary.getCurrency()
            );
        } else {
            log.warn("Order details not available for order: {}", feedback.getOrderId());
        }

        return builder.build();
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