package com.shopflow.user.service;

import com.shopflow.user.config.JwtUtil;
import com.shopflow.user.config.KafkaEventPublisher;
import com.shopflow.user.dto.UserDto;
import com.shopflow.user.model.User;
import com.shopflow.user.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final KafkaEventPublisher kafkaEventPublisher;

    /**
     * ✅ FIX: App startup pe default ADMIN seed karo
     * Credentials: admin@shopflow.com / admin123
     */
    @PostConstruct
    public void seedAdminUser() {
        if (!userRepository.existsByEmail("admin@shopflow.com")) {
            User admin = User.builder()
                    .name("Admin")
                    .email("admin@shopflow.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(User.Role.ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("✅ Default admin user seeded: admin@shopflow.com / admin123");
        }
    }

    @Transactional
    public UserDto.AuthResponse register(UserDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .build();

        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        kafkaEventPublisher.publishUserRegistered(user.getEmail(), user.getName());

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new UserDto.AuthResponse(token, user.getName(), user.getEmail(), user.getRole().name());
    }

    public UserDto.AuthResponse login(UserDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        log.info("User logged in: {} (role={})", user.getEmail(), user.getRole());
        return new UserDto.AuthResponse(token, user.getName(), user.getEmail(), user.getRole().name());
    }

    /**
     * ✅ FIX: getAllUsers now ADMIN-only (enforced at Gateway level too)
     */
    public List<UserDto.UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserDto.UserResponse(u.getId(), u.getName(), u.getEmail(), u.getRole().name()))
                .collect(Collectors.toList());
    }

    /**
     * ✅ NEW: Profile endpoint - return current user details from JWT email
     */
    public UserDto.UserResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return new UserDto.UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }

    public boolean validateEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
