package com.ctse.authservice.service;

import com.ctse.authservice.dto.*;
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

    /**
     * Get user profile by username
     */
    public UserProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));
        return mapToProfileResponse(user);
    }

    /**
     * Get user profile by user ID
     */
    public UserProfileResponse getProfileById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return mapToProfileResponse(user);
    }

    /**
     * Update user profile
     */
    @Transactional
    public UserProfileResponse updateProfile(String username, ProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));

        // Update username if provided
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new ConflictException("User", "username", request.getUsername());
            }
            user.setUsername(request.getUsername());
        }

        // Update email if provided
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ConflictException("User", "email", request.getEmail());
            }
            user.setEmail(request.getEmail());
        }

        // Update password if provided
        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            // Verify current password
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()) {
                throw new BadRequestException("Current password is required to change password");
            }

            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new UnauthorizedException("Current password is incorrect");
            }

            // Encode and set new password
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        User updatedUser = userRepository.save(user);
        log.info("User profile updated: id={}, username={}", updatedUser.getId(), updatedUser.getUsername());

        return mapToProfileResponse(updatedUser);
    }

    /**
     * Delete user account (soft delete or hard delete)
     */
    @Transactional
    public void deleteUser(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));

        // Verify password before deletion
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new UnauthorizedException("Password is incorrect");
        }

        // Soft delete - deactivate account
        user.setActive(false);
        userRepository.save(user);

        // For hard delete, use:
        // userRepository.delete(user);

        log.info("User account deactivated: id={}, username={}", user.getId(), user.getUsername());
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

    private UserProfileResponse mapToProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoleList())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
