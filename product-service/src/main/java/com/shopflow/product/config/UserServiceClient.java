package com.shopflow.product.config;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.Map;

// SYNC communication - Product service directly calls User service
// "lb://user-service" means Eureka se load balanced URL milega
@FeignClient(name = "user-service", fallback = UserServiceFallback.class)
public interface UserServiceClient {

    @GetMapping("/api/users/validate")
    Map<String, Boolean> validateUser(@RequestParam("email") String email);
}
