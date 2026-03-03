package com.ctse.authservice.service;

import com.ctse.authservice.dto.AuthResponse;
import com.ctse.authservice.dto.LoginRequest;
import com.ctse.authservice.dto.RegisterRequest;
import com.ctse.authservice.model.User;
import com.ctse.authservice.repository.UserRepository;
import com.ctse.authservice.security.JwtUtil;
import com.ctse.common.exception.BadRequestException;
import com.ctse.common.exception.ConflictException;
import com.ctse.common.exception.ResourceNotFoundException;
import com.ctse.common.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("User", "username", request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("User", "email", request.getEmail());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles("ROLE_USER")
                .build();

        User saved = userRepository.save(user);
        log.info("Registered new user: id={}, username={}", saved.getId(), saved.getUsername());

        String token = jwtUtil.generateToken(saved, saved.getId(), saved.getRoleList());
        return buildResponse(saved, token);
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (BadCredentialsException e) {
            throw new UnauthorizedException("Invalid username or password");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getUsername()));

        String token = jwtUtil.generateToken(user, user.getId(), user.getRoleList());
        log.info("User logged in: {}", user.getUsername());
        return buildResponse(user, token);
    }

    public User getProfile(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));
    }

    public User getById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }

    private AuthResponse buildResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoleList())
                .build();
    }
}
