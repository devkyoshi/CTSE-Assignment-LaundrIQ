package com.ctse.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private String id;
    private String username;
    private String email;
    private String roles;
    private Boolean active;
}