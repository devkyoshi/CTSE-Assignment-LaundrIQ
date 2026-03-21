package com.ctse.customer.mapper;
import com.ctse.customer.dto.*;
import com.ctse.customer.model.Address;
import com.ctse.customer.model.Customer;
import com.ctse.customer.model.Preferences;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {

    public Customer toEntity(CustomerRequest dto, String customerId) {
        Customer customer = new Customer();
        customer.setCustomerId(customerId);
        customer.setName(dto.getName());
        customer.setEmail(dto.getEmail());
        customer.setPhoneNumber(dto.getPhoneNumber());
        return customer;
    }

    public CustomerResponse toDto(Customer entity) {
        CustomerResponse response = new CustomerResponse();
        response.setId(entity.getId());
        response.setCustomerId(entity.getCustomerId());
        response.setName(entity.getName());
        response.setEmail(entity.getEmail());
        response.setPhoneNumber(entity.getPhoneNumber());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }

    public Address toEntity(AddressRequest dto, Customer customer) {
        Address address = new Address();
        address.setAddressLine(dto.getAddressLine());
        address.setAddressLine2(dto.getAddressLine2());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setPostalCode(dto.getPostalCode());
        address.setCountry(dto.getCountry());
        address.setIsDefault(dto.getIsDefault());
        address.setCustomer(customer);
        return address;
    }

    public AddressResponse toDto(Address entity) {
        AddressResponse response = new AddressResponse();
        response.setId(entity.getId());
        response.setAddressLine(entity.getAddressLine());
        response.setAddressLine2(entity.getAddressLine2());
        response.setCity(entity.getCity());
        response.setState(entity.getState());
        response.setPostalCode(entity.getPostalCode());
        response.setCountry(entity.getCountry());
        response.setIsDefault(entity.getIsDefault());
        return response;
    }

    public Preferences toEntity(PreferencesRequest dto, Customer customer) {
        Preferences preferences = new Preferences();
        preferences.setEmailNotifications(dto.getEmailNotifications());
        preferences.setSmsNotifications(dto.getSmsNotifications());
        preferences.setPreferredLanguage(dto.getPreferredLanguage());
        preferences.setPreferredPaymentMethod(dto.getPreferredPaymentMethod());
        preferences.setPreferredServiceType(dto.getPreferredServiceType());
        preferences.setCustomer(customer);
        return preferences;
    }

    public PreferencesResponse toDto(Preferences entity) {
        PreferencesResponse response = new PreferencesResponse();
        response.setId(entity.getId());
        response.setEmailNotifications(entity.getEmailNotifications());
        response.setSmsNotifications(entity.getSmsNotifications());
        response.setPreferredLanguage(entity.getPreferredLanguage());
        response.setPreferredPaymentMethod(entity.getPreferredPaymentMethod());
        response.setPreferredServiceType(entity.getPreferredServiceType());
        return response;
    }
}