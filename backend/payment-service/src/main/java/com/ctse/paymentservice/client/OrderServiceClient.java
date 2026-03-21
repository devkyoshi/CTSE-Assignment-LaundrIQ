package com.ctse.paymentservice.client;

import com.ctse.common.exception.BadRequestException;
import com.ctse.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderServiceClient {

    private final RestTemplate restTemplate;

    @Value("${order-service.base-url}")
    private String orderServiceBaseUrl;

    public OrderInfo getOrder(Long orderId) {
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    orderServiceBaseUrl + "/api/orders/" + orderId,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );

            Map<String, Object> body = response.getBody();
            if (body == null || !Boolean.TRUE.equals(body.get("success"))) {
                throw new ResourceNotFoundException("Order not found: " + orderId);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) body.get("data");
            if (data == null) {
                throw new ResourceNotFoundException("Order not found: " + orderId);
            }

            OrderInfo info = new OrderInfo();
            info.setId(((Number) data.get("id")).longValue());
            info.setCustomerId((String) data.get("customerId"));
            info.setTotalPrice(((Number) data.get("totalPrice")).doubleValue());
            info.setStatus((String) data.get("status"));
            return info;
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Order not found: " + orderId);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch order {}: {}", orderId, e.getMessage());
            throw new BadRequestException("Unable to verify order: " + orderId);
        }
    }

    public void updateOrderStatus(Long orderId, String status) {
        try {
            restTemplate.patchForObject(
                    orderServiceBaseUrl + "/api/orders/" + orderId + "/status?status=" + status,
                    null,
                    Object.class
            );
        } catch (Exception e) {
            log.error("Failed to update order {} status to {}: {}", orderId, status, e.getMessage());
        }
    }
}
