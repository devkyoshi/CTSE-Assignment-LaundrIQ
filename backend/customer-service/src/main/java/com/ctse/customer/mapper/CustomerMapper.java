package com.ctse.customer.mapper;

import com.ctse.customer.dto.AddressDto;
import com.ctse.customer.dto.AddressRequest;
import com.ctse.customer.dto.PreferencesDto;
import com.ctse.customer.model.Address;
import com.ctse.customer.model.CustomerPreferences;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {

    public Address toEntity(AddressRequest dto) {
        Address address = new Address();
        address.setCustomerId(dto.getCustomerId());
        address.setAddressLine1(dto.getAddressLine1());
        address.setAddressLine2(dto.getAddressLine2());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setPostalCode(dto.getPostalCode());
        address.setCountry(dto.getCountry());
        address.setPhoneNumber(dto.getPhoneNumber());
        address.setIsDefault(dto.getIsDefault());
        address.setAddressType(dto.getAddressType());
        return address;
    }

    public AddressDto toDto(Address entity) {
        AddressDto dto = new AddressDto();
        dto.setId(entity.getId());
        dto.setCustomerId(entity.getCustomerId());
        dto.setAddressLine1(entity.getAddressLine1());
        dto.setAddressLine2(entity.getAddressLine2());
        dto.setCity(entity.getCity());
        dto.setState(entity.getState());
        dto.setPostalCode(entity.getPostalCode());
        dto.setCountry(entity.getCountry());
        dto.setPhoneNumber(entity.getPhoneNumber());
        dto.setIsDefault(entity.getIsDefault());
        dto.setAddressType(entity.getAddressType());
        return dto;
    }

    public CustomerPreferences toEntity(String customerId, PreferencesDto dto) {
        CustomerPreferences prefs = new CustomerPreferences();
        prefs.setCustomerId(customerId);
        prefs.setPreferredLanguage(dto.getPreferredLanguage() != null ? dto.getPreferredLanguage() : "en");
        prefs.setEmailNotifications(dto.getEmailNotifications() != null ? dto.getEmailNotifications() : true);
        prefs.setSmsNotifications(dto.getSmsNotifications() != null ? dto.getSmsNotifications() : false);
        prefs.setPreferredPaymentMethod(dto.getPreferredPaymentMethod());
        prefs.setPreferredServiceType(dto.getPreferredServiceType());
        prefs.setIsExpressPreferred(dto.getIsExpressPreferred() != null ? dto.getIsExpressPreferred() : false);
        prefs.setIsDryCleanPreferred(dto.getIsDryCleanPreferred() != null ? dto.getIsDryCleanPreferred() : false);
        return prefs;
    }

    public PreferencesDto toDto(CustomerPreferences entity) {
        PreferencesDto dto = new PreferencesDto();
        dto.setPreferredLanguage(entity.getPreferredLanguage());
        dto.setEmailNotifications(entity.getEmailNotifications());
        dto.setSmsNotifications(entity.getSmsNotifications());
        dto.setPreferredPaymentMethod(entity.getPreferredPaymentMethod());
        dto.setPreferredServiceType(entity.getPreferredServiceType());
        dto.setIsExpressPreferred(entity.getIsExpressPreferred());
        dto.setIsDryCleanPreferred(entity.getIsDryCleanPreferred());
        return dto;
    }
}