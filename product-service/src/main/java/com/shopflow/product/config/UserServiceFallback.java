package com.shopflow.product.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.util.Map;

// Agar user-service down ho toh ye fallback chalega (circuit breaker pattern)
@Slf4j
@Component
public class UserServiceFallback implements UserServiceClient {

    @Override
    public Map<String, Boolean> validateUser(String email) {
        log.warn("User service is DOWN! Fallback triggered for email: {}", email);
        // Safe default - user exist maan lo jab service down ho
        return Map.of("exists", true);
    }
}
