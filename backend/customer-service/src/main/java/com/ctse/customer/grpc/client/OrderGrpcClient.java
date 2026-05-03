package com.ctse.customer.grpc.client;

import com.ctse.grpc.order.GetOrderSummaryRequest;
import com.ctse.grpc.order.GetOrderSummaryResponse;
import com.ctse.grpc.order.OrderServiceGrpc;
import io.grpc.StatusRuntimeException;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class OrderGrpcClient {

    @GrpcClient("order-service")
    private OrderServiceGrpc.OrderServiceBlockingStub orderStub;

    /**
     * Fetch order summary by order ID
     */
    public GetOrderSummaryResponse getOrderSummary(String orderId) {
        try {
            log.info("Fetching order summary for orderId: {}", orderId);

            GetOrderSummaryRequest request = GetOrderSummaryRequest.newBuilder()
                    .setOrderId(orderId)
                    .build();

            GetOrderSummaryResponse response = orderStub.getOrderSummary(request);

            log.info("Successfully fetched order summary for orderId: {}", orderId);
            return response;

        } catch (StatusRuntimeException e) {
            log.error("gRPC error while fetching order {}: {}", orderId, e.getStatus(), e);
            return null;
        } catch (Exception e) {
            log.error("Unexpected error while fetching order {}: {}", orderId, e.getMessage(), e);
            return null;
        }
    }

}