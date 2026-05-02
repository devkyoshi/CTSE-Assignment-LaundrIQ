package com.ctse.paymentservice.client;

import com.ctse.common.exception.BadRequestException;
import com.ctse.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderServiceClient {

    private static final String SERVERLESS_AUTH_HEADER = "X-Serverless-Authorization";
    private static final String METADATA_FLAVOR_HEADER = "Metadata-Flavor";
    private static final String METADATA_FLAVOR_VALUE = "Google";
    private static final Duration TOKEN_REFRESH_SKEW = Duration.ofMinutes(2);

    private final RestTemplate restTemplate;

    @Value("${order-service.base-url}")
    private String orderServiceBaseUrl;

    private volatile CachedToken cachedToken;

    public OrderInfo getOrder(Long orderId) {
        try {
            HttpHeaders headers = buildAuthHeaders();
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    orderServiceBaseUrl + "/api/orders/" + orderId,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
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
            @SuppressWarnings("unchecked")
            Map<String, Object> pickupSlot = (Map<String, Object>) data.get("pickupSlot");
            if (pickupSlot != null) {
                info.setPickupDate((String) pickupSlot.get("date"));
            }
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
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.putAll(buildAuthHeaders());

            Map<String, String> payload = new HashMap<>();
            payload.put("status", status);

            restTemplate.exchange(
                    orderServiceBaseUrl + "/api/orders/" + orderId + "/status",
                    HttpMethod.PUT,
                    new HttpEntity<>(payload, headers),
                    Object.class
            );
        } catch (Exception e) {
            log.error("Failed to update order {} status to {}: {}", orderId, status, e.getMessage());
        }
    }

    private HttpHeaders buildAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        if (!isCloudRunTarget(orderServiceBaseUrl)) {
            return headers;
        }

        try {
            String token = resolveIdToken(audienceFor(orderServiceBaseUrl));
            if (token != null && !token.isBlank()) {
                headers.set(SERVERLESS_AUTH_HEADER, "Bearer " + token);
            }
        } catch (Exception e) {
            log.warn("Failed to resolve Cloud Run ID token: {}", e.getMessage());
        }

        return headers;
    }

    private String resolveIdToken(String audience) {
        CachedToken cached = cachedToken;
        if (cached != null && cached.expiresAt.isAfter(Instant.now().plus(TOKEN_REFRESH_SKEW))) {
            return cached.token;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set(METADATA_FLAVOR_HEADER, METADATA_FLAVOR_VALUE);
        String url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity"
                + "?audience=" + audience
                + "&format=full";

        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class
        );

        String token = response.getBody();
        if (token == null) {
            return null;
        }

        token = token.trim();
        cachedToken = new CachedToken(token, parseExpiry(token));
        return token;
    }

    private boolean isCloudRunTarget(String baseUrl) {
        try {
            URI uri = URI.create(baseUrl);
            String host = uri.getHost();
            return uri.getScheme() != null
                    && uri.getScheme().equalsIgnoreCase("https")
                    && host != null
                    && host.endsWith(".run.app");
        } catch (Exception e) {
            return false;
        }
    }

    private String audienceFor(String baseUrl) {
        URI uri = URI.create(baseUrl);
        return uri.getScheme() + "://" + uri.getHost();
    }

    private Instant parseExpiry(String jwt) {
        try {
            String[] parts = jwt.split("\\.");
            if (parts.length < 2) {
                return Instant.now().plus(Duration.ofMinutes(30));
            }
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            int expIdx = payloadJson.indexOf("\"exp\":");
            if (expIdx < 0) {
                return Instant.now().plus(Duration.ofMinutes(30));
            }
            int start = expIdx + 6;
            int end = start;
            while (end < payloadJson.length() && Character.isDigit(payloadJson.charAt(end))) {
                end++;
            }
            long expEpochSeconds = Long.parseLong(payloadJson.substring(start, end));
            return Instant.ofEpochSecond(expEpochSeconds);
        } catch (Exception ignored) {
            return Instant.now().plus(Duration.ofMinutes(30));
        }
    }

    private static class CachedToken {
        private final String token;
        private final Instant expiresAt;

        private CachedToken(String token, Instant expiresAt) {
            this.token = token;
            this.expiresAt = expiresAt;
        }
    }
}
