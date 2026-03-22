package com.ctse.orderservice.grpc.client;

import com.ctse.grpc.customer.CustomerServiceGrpc;
import com.ctse.grpc.customer.GetLoyaltyRequest;
import com.ctse.grpc.customer.LoyaltyResponse;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CustomerGrpcClient {

    @GrpcClient("customer-service")
    private CustomerServiceGrpc.CustomerServiceBlockingStub customerStub;

    public double getCustomerDiscount(String customerId) {
        try {
            log.info("Fetching loyalty discount for customer: {}", customerId);
            GetLoyaltyRequest request = GetLoyaltyRequest.newBuilder()
                    .setCustomerId(customerId)
                    .build();
            LoyaltyResponse response = customerStub.getCustomerLoyalty(request);
            log.info("Customer {} tier: {}, discount: {}", customerId, response.getTier(), response.getDiscountPercentage());
            return response.getDiscountPercentage();
        } catch (Exception e) {
            log.warn("Failed to fetch loyalty discount for customer: {}, falling back to 0.0", customerId, e);
            return 0.0;
        }
    }
}
