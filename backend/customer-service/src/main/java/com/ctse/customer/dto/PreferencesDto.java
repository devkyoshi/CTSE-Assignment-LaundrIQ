package com.ctse.customer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PreferencesDto {

    private String preferredLanguage;

    private Boolean emailNotifications;

    private Boolean smsNotifications;

    private String preferredPaymentMethod;

    private String preferredServiceType;

    private Boolean isExpressPreferred;

    private Boolean isDryCleanPreferred;
}