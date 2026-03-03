package com.ctse.authservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String tokenType;
    private String userId;
    private String username;
    private String email;
    private List<String> roles;
}
