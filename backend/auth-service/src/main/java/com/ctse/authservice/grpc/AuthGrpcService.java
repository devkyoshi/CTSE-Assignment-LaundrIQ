package com.ctse.authservice.grpc;

import com.ctse.authservice.model.User;
import com.ctse.authservice.repository.UserRepository;
import com.ctse.authservice.security.JwtUtil;
import com.ctse.grpc.auth.*;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

/**
 * gRPC server implementation of AuthService.
 * Other microservices call this to validate JWT tokens without an HTTP round-trip.
 */
@Slf4j
@GrpcService
@RequiredArgsConstructor
public class AuthGrpcService extends AuthServiceGrpc.AuthServiceImplBase {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    public void validateToken(ValidateTokenRequest request,
                              StreamObserver<ValidateTokenResponse> responseObserver) {
        log.debug("gRPC validateToken called");

        if (!jwtUtil.validateToken(request.getToken())) {
            responseObserver.onNext(ValidateTokenResponse.newBuilder()
                    .setValid(false)
                    .build());
            responseObserver.onCompleted();
            return;
        }

        String username = jwtUtil.extractUsername(request.getToken());
        String userId   = jwtUtil.extractUserId(request.getToken());
        var roles       = jwtUtil.extractRoles(request.getToken());

        userRepository.findByUsername(username).ifPresentOrElse(user -> {
            responseObserver.onNext(ValidateTokenResponse.newBuilder()
                    .setValid(true)
                    .setUserId(userId)
                    .setUsername(username)
                    .setEmail(user.getEmail())
                    .addAllRoles(roles != null ? roles : user.getRoleList())
                    .build());
            responseObserver.onCompleted();
        }, () -> responseObserver.onNext(ValidateTokenResponse.newBuilder()
                .setValid(false).build()));
    }

    @Override
    public void getUser(GetUserRequest request,
                        StreamObserver<GetUserResponse> responseObserver) {
        log.debug("gRPC getUser: userId={}", request.getUserId());

        userRepository.findById(request.getUserId()).ifPresentOrElse(user -> {
            responseObserver.onNext(GetUserResponse.newBuilder()
                    .setUserId(user.getId())
                    .setUsername(user.getUsername())
                    .setEmail(user.getEmail())
                    .addAllRoles(user.getRoleList())
                    .setActive(user.isActive())
                    .build());
            responseObserver.onCompleted();
        }, () -> responseObserver.onError(
                Status.NOT_FOUND
                        .withDescription("User not found: " + request.getUserId())
                        .asRuntimeException()));
    }
}
