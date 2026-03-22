package com.ctse.orderservice.grpc.client;

import com.ctse.common.exception.ResourceNotFoundException;
import com.ctse.grpc.order.*;
import com.ctse.orderservice.dto.OrderResponse;
import com.ctse.orderservice.service.OrderService;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public class OrderGrpcServiceImpl extends OrderServiceGrpc.OrderServiceImplBase {

    private final OrderService orderService;

    @Override
    public void getOrderSummary(GetOrderSummaryRequest request,
                                StreamObserver<GetOrderSummaryResponse> responseObserver) {
        try {
            String orderId = request.getOrderId();
            log.info("Received GetOrderSummary request for orderId: {}", orderId);

            // Parse the orderId from String to Long
            Long id;
            try {
                id = Long.parseLong(orderId);
            } catch (NumberFormatException e) {
                log.warn("Invalid orderId format: {}", orderId);
                responseObserver.onError(Status.INVALID_ARGUMENT
                        .withDescription("Invalid order ID format: " + orderId)
                        .asRuntimeException());
                return;
            }

            // Fetch order from your existing OrderService
            OrderResponse order = orderService.findById(id);

            // Build response
            GetOrderSummaryResponse response = GetOrderSummaryResponse.newBuilder()
                    .setOrderId(String.valueOf(order.getId()))
                    .setCustomerId(order.getCustomerId())
                    .setTotalAmount(order.getTotalPrice())
                    .setCurrency("LKR") // Set default currency or fetch from your order
                    .setStatus(mapOrderStatus(order.getStatus()))
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();

            log.info("Successfully returned order summary for orderId: {}", orderId);

        } catch (ResourceNotFoundException e) {
            log.warn("Order not found: {}", request.getOrderId());
            responseObserver.onError(Status.NOT_FOUND
                    .withDescription("Order not found: " + request.getOrderId())
                    .asRuntimeException());
        } catch (Exception e) {
            log.error("Error in getOrderSummary: {}", e.getMessage(), e);
            responseObserver.onError(Status.INTERNAL
                    .withDescription("Internal server error: " + e.getMessage())
                    .asRuntimeException());
        }
    }

    // Helper method to map internal order status to gRPC enum
    private OrderStatus mapOrderStatus(String internalStatus) {
        if (internalStatus == null) return OrderStatus.PENDING;

        switch (internalStatus.toUpperCase()) {
            case "PENDING":
                return OrderStatus.PENDING;
            case "CONFIRMED":
                return OrderStatus.CONFIRMED;
            case "PROCESSING":
                return OrderStatus.PROCESSING;
            case "READY":
                return OrderStatus.READY;
            case "DELIVERED":
                return OrderStatus.DELIVERED;
            case "CANCELLED":
                return OrderStatus.CANCELLED;
            default:
                return OrderStatus.PENDING;
        }
    }

    // Helper method to convert gRPC enum to internal status
    private String convertToInternalStatus(OrderStatus grpcStatus) {
        switch (grpcStatus) {
            case PENDING:
                return "PENDING";
            case CONFIRMED:
                return "CONFIRMED";
            case PROCESSING:
                return "PROCESSING";
            case READY:
                return "READY";
            case DELIVERED:
                return "DELIVERED";
            case CANCELLED:
                return "CANCELLED";
            default:
                return "PENDING";
        }
    }
}