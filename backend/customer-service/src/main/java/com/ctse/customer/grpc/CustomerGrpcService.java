package com.ctse.customer.grpc;

import com.ctse.customer.dto.LoyaltyAccountDto;
import com.ctse.customer.service.LoyaltyService;
import com.ctse.grpc.customer.CustomerServiceGrpc;
import com.ctse.grpc.customer.GetLoyaltyRequest;
import com.ctse.grpc.customer.LoyaltyResponse;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

@Slf4j
@GrpcService
@RequiredArgsConstructor
public class CustomerGrpcService extends CustomerServiceGrpc.CustomerServiceImplBase {

    private final LoyaltyService loyaltyService;

    @Override
    public void getCustomerLoyalty(GetLoyaltyRequest request, StreamObserver<LoyaltyResponse> responseObserver) {
        log.info("Received gRPC request for customer loyalty: {}", request.getCustomerId());
        try {
            LoyaltyAccountDto account = loyaltyService.getAccount(request.getCustomerId());
            double discount = getDiscountPercentage(account.getTier().name());
            
            LoyaltyResponse response = LoyaltyResponse.newBuilder()
                    .setTier(account.getTier().name())
                    .setDiscountPercentage(discount)
                    .build();
                    
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error retrieving loyalty for customer id: {}", request.getCustomerId(), e);
            responseObserver.onError(e);
        }
    }

    private double getDiscountPercentage(String tier) {
        switch (tier) {
            case "SILVER":
                return 0.05;
            case "GOLD":
                return 0.10;
            case "PLATINUM":
                return 0.15;
            case "BRONZE":
            default:
                return 0.0;
        }
    }
}
