package com.ctse.customer.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderRestClient {

    private static final String SERVERLESS_AUTH_HEADER = "X-Serverless-Authorization";
    private static final String METADATA_FLAVOR_HEADER = "Metadata-Flavor";
    private static final String METADATA_FLAVOR_VALUE = "Google";
    private static final Duration TOKEN_REFRESH_SKEW = Duration.ofMinutes(2);

    private final RestTemplate restTemplate;

    @Value("${order-service.base-url}")
    private String orderServiceBaseUrl;

    private volatile CachedToken cachedToken;

    /**
     * Confirms the order exists (HTTP 200 from order-service) and {@code customerId} matches the order owner.
     */
    public boolean validateOrderOwnership(String orderId, String customerId) {
        Long id;
        try {
            id = Long.parseLong(orderId);
        } catch (NumberFormatException e) {
            log.warn("Invalid order id format: {}", orderId);
            return false;
        }

        String base = orderServiceBaseUrl.endsWith("/")
                ? orderServiceBaseUrl.substring(0, orderServiceBaseUrl.length() - 1)
                : orderServiceBaseUrl;
        String url = base + "/api/orders/" + id;

        try {
            HttpHeaders headers = buildAuthHeaders();
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> body = response.getBody();
            if (body == null || !Boolean.TRUE.equals(body.get("success"))) {
                log.warn("Order service returned unsuccessful envelope for order {}", orderId);
                return false;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) body.get("data");
            if (data == null) {
                log.warn("Order {} missing data in API response", orderId);
                return false;
            }

            String orderCustomerId = (String) data.get("customerId");
            boolean ok = customerId != null && customerId.equals(orderCustomerId);
            if (!ok) {
                log.warn("Order {} does not belong to customer {}", orderId, customerId);
            }
            return ok;
        } catch (HttpClientErrorException.NotFound e) {
            log.warn("Order not found: {}", orderId);
            return false;
        } catch (HttpClientErrorException.Forbidden | HttpClientErrorException.Unauthorized e) {
            log.error("Order service rejected request (auth?): {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("REST error validating order ownership for {}: {}", orderId, e.getMessage(), e);
            return false;
        }
    }

    /** Same pattern as {@code payment-service}'s {@code OrderServiceClient} — Cloud Run requires an ID token for HTTPS *.run.app targets. */
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
        String metadataUrl = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity"
                + "?audience=" + audience
                + "&format=full";

        ResponseEntity<String> response = restTemplate.exchange(
                metadataUrl,
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
