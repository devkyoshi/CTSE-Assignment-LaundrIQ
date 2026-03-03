package com.ctse.authservice.controller;

import com.ctse.authservice.dto.AuthResponse;
import com.ctse.authservice.dto.LoginRequest;
import com.ctse.authservice.dto.RegisterRequest;
import com.ctse.authservice.model.User;
import com.ctse.authservice.service.AuthService;
import com.ctse.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** Register a new user and return a JWT. */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", authService.register(request)));
    }

    /** Authenticate and return a JWT. */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Login successful", authService.login(request)));
    }

    /** Returns the current user's profile (requires valid JWT). */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> me(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(
                ApiResponse.success(authService.getProfile(principal.getUsername())));
    }
}
