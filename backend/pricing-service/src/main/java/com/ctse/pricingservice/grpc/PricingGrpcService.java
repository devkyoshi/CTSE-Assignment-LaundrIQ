package com.ctse.pricingservice.grpc;

import com.ctse.grpc.pricing.*;
import com.ctse.pricingservice.model.PriceCatalogue;
import com.ctse.pricingservice.repository.PriceCatalogueRepository;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.List;

/**
 * gRPC server implementation of PricingService.
 * Called by order-service to resolve prices during order creation.
 */
@Slf4j
@GrpcService
@RequiredArgsConstructor
public class PricingGrpcService extends PricingServiceGrpc.PricingServiceImplBase {

    private final PriceCatalogueRepository repository;

    @Override
    public void getPrice(GetPriceRequest request, StreamObserver<GetPriceResponse> responseObserver) {
        log.info("gRPC getPrice: service={}, item={}, qty={}",
                request.getServiceType(), request.getItemType(), request.getQuantity());

        repository.findByServiceTypeAndItemType(
                        request.getServiceType().toUpperCase(),
                        request.getItemType().toUpperCase())
                .ifPresentOrElse(entry -> {
                    double total = entry.getUnitPrice() * request.getQuantity();
                    GetPriceResponse response = GetPriceResponse.newBuilder()
                            .setServiceType(entry.getServiceType())
                            .setItemType(entry.getItemType())
                            .setQuantity(request.getQuantity())
                            .setUnitPrice(entry.getUnitPrice())
                            .setTotalPrice(total)
                            .setCurrency(entry.getCurrency())
                            .build();
                    responseObserver.onNext(response);
                    responseObserver.onCompleted();
                }, () -> responseObserver.onError(
                        Status.NOT_FOUND
                                .withDescription("No price found for "
                                        + request.getServiceType() + "/" + request.getItemType())
                                .asRuntimeException()));
    }

    @Override
    public void getAllPrices(GetAllPricesRequest request, StreamObserver<GetAllPricesResponse> responseObserver) {
        log.info("gRPC getAllPrices: serviceTypeFilter='{}'", request.getServiceType());

        List<PriceCatalogue> entries = request.getServiceType().isBlank()
                ? repository.findAll()
                : repository.findByServiceType(request.getServiceType().toUpperCase());

        GetAllPricesResponse.Builder builder = GetAllPricesResponse.newBuilder();
        entries.forEach(e -> builder.addPrices(PriceEntry.newBuilder()
                .setServiceType(e.getServiceType())
                .setItemType(e.getItemType())
                .setUnitPrice(e.getUnitPrice())
                .setCurrency(e.getCurrency())
                .build()));

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }
}
