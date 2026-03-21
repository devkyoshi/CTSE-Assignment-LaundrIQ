package com.ctse.customer.dto;

import lombok.Data;

@Data
public class PreferencesResponse {

    private Long id;
    private Boolean emailNotifications;
    private Boolean smsNotifications;
    private String preferredLanguage;
    private String preferredPaymentMethod;
    private String preferredServiceType;
}