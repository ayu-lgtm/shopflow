package com.shopflow.user.controller;

import com.shopflow.user.dto.UserDto;
import com.shopflow.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserDto.AuthResponse> register(@Valid @RequestBody UserDto.RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<UserDto.AuthResponse> login(@Valid @RequestBody UserDto.LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    /**
     * ✅ ADMIN-only — Gateway enforces ROLE_ADMIN (hasAuthority check)
     */
    @GetMapping("/all")
    public ResponseEntity<List<UserDto.UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * ✅ NEW: Profile — Gateway injects X-User-Email header from JWT
     */
    @GetMapping("/profile")
    public ResponseEntity<UserDto.UserResponse> getProfile(
            @RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(userService.getProfile(email));
    }

    /**
     * Product service Feign Client isse call karta hai (internal sync call)
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Boolean>> validateUser(@RequestParam String email) {
        return ResponseEntity.ok(Map.of("exists", userService.validateEmail(email)));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "user-service"));
    }

    /**
     * ✅ Global exception handler for this controller
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleError(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
