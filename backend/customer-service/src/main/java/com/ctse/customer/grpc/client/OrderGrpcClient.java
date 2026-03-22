package com.ctse.customer.grpc.client;


import com.ctse.grpc.order.GetOrderSummaryRequest;
import com.ctse.grpc.order.GetOrderSummaryResponse;
import com.ctse.grpc.order.OrderServiceGrpc;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class OrderGrpcClient {

    @GrpcClient("order-service")
    private OrderServiceGrpc.OrderServiceBlockingStub orderStub;

    public GetOrderSummaryResponse GetOrderSummary(GetOrderSummaryRequest getOrderSummaryRequest) {
        try {
            return orderStub.getOrderSummary(getOrderSummaryRequest);
        } catch (Exception e) {
            log.error("Error fetching order summary: {}", e.getMessage());
            throw e;
        }

    }

}