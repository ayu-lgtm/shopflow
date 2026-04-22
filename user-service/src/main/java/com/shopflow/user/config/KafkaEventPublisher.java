package com.shopflow.user.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;

    // Async - fire and forget: user register hone par product service ko notify karo
    public void publishUserRegistered(String email, String name) {
        String message = String.format("{\"email\":\"%s\",\"name\":\"%s\",\"event\":\"USER_REGISTERED\"}", email, name);
        kafkaTemplate.send("user-events", email, message);
        log.info("Published USER_REGISTERED event for: {}", email);
    }
}
