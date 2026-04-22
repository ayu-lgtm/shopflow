package com.shopflow.product.kafka;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

// ASYNC communication - User service Kafka pe event publish karta hai
// Product service apne time pe sun-ta hai - dono ko ek doosre ka wait nahi
@Slf4j
@Component
public class UserEventConsumer {

    @KafkaListener(topics = "user-events", groupId = "product-service-group")
    public void handleUserRegistered(String message) {
        log.info("=== ASYNC EVENT RECEIVED from Kafka ===");
        log.info("Message: {}", message);

        // Real app mein: naye user ke liye welcome product ya discount create karo
        // Abhi sirf log kar rahe hain
        if (message.contains("USER_REGISTERED")) {
            log.info("New user registered! Could create welcome offer now.");
        }
    }
}
