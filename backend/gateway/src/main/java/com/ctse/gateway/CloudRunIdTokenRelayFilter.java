package com.ctse.gateway;

import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class CloudRunIdTokenRelayFilter implements GlobalFilter {

    private static final String SERVERLESS_AUTH_HEADER = "X-Serverless-Authorization";
    private static final Duration TOKEN_REFRESH_SKEW = Duration.ofMinutes(2);

    private final WebClient webClient = WebClient.builder()
            .defaultHeader("Metadata-Flavor", "Google")
            .build();

    private final Map<String, CachedToken> tokenCache = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        URI target = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR);
        if (!isCloudRunTarget(target)) {
            return chain.filter(exchange);
        }

        String audience = audienceFor(target);
        return resolveIdToken(audience)
                .flatMap(token -> {
                    ServerHttpRequest mutated = exchange.getRequest().mutate()
                            // Preserve app-level Authorization (JWT), use Cloud Run specific auth header.
                            .headers(headers -> headers.set(SERVERLESS_AUTH_HEADER, "Bearer " + token))
                            .build();
                    return chain.filter(exchange.mutate().request(mutated).build());
                })
                // If metadata token fetch fails, pass through and let downstream reject explicitly.
                .onErrorResume(ex -> chain.filter(exchange));
    }

    private Mono<String> resolveIdToken(String audience) {
        CachedToken cached = tokenCache.get(audience);
        if (cached != null && cached.expiresAt().isAfter(Instant.now().plus(TOKEN_REFRESH_SKEW))) {
            return Mono.just(cached.token());
        }

        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("http")
                        .host("metadata.google.internal")
                        .path("/computeMetadata/v1/instance/service-accounts/default/identity")
                        .queryParam("audience", audience)
                        .queryParam("format", "full")
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .map(String::trim)
                .doOnNext(token -> tokenCache.put(audience, new CachedToken(token, parseExpiry(token))));
    }

    private boolean isCloudRunTarget(URI target) {
        return target != null
                && "https".equalsIgnoreCase(target.getScheme())
                && target.getHost() != null
                && target.getHost().endsWith(".run.app");
    }

    private String audienceFor(URI target) {
        return target.getScheme() + "://" + target.getAuthority();
    }

    private Instant parseExpiry(String jwt) {
        try {
            String[] parts = jwt.split("\\.");
            if (parts.length < 2) {
                return Instant.now().plus(Duration.ofMinutes(30));
            }
            String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
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

    private record CachedToken(String token, Instant expiresAt) {}
}
