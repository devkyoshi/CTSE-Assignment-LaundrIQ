package com.ctse.customer.dto;

import lombok.Data;

@Data
public class AddressResponse {

    private Long id;
    private String addressLine;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private Boolean isDefault;
}