package com.shopflow.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * ✅ FIXED Gateway SecurityConfig
 *
 * Kya fix kiya:
 * 1. ADMIN-only endpoints properly protected (create/delete product, get all users)
 * 2. JWT claims se email + role extract karke downstream headers inject karo
 * 3. Role converter: JWT "role" claim → Spring Security ROLE_XXX GrantedAuthority
 * 4. CORS properly configured
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Value("${jwt.secret:shopflow-super-secret-key-must-be-256-bits-long!}")
    private String jwtSecret;

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(ex -> ex
                        // ── Public endpoints (no auth needed) ─────────────────
                        .pathMatchers("/api/users/register", "/api/users/login").permitAll()
                        .pathMatchers("/api/users/validate", "/api/users/health").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/products", "/api/products/{id}", "/api/products/search", "/api/products/health").permitAll()
                        .pathMatchers("/eureka/**", "/actuator/**").permitAll()

                        // ── ADMIN-only endpoints ───────────────────────────────
                        .pathMatchers("/api/users/all").hasAuthority("ROLE_ADMIN")
                        .pathMatchers(HttpMethod.POST, "/api/products").hasAuthority("ROLE_ADMIN")
                        .pathMatchers(HttpMethod.DELETE, "/api/products/**").hasAuthority("ROLE_ADMIN")
                        .pathMatchers(HttpMethod.PUT, "/api/products/**").hasAuthority("ROLE_ADMIN")

                        // ── Authenticated (any logged-in user) ─────────────────
                        .pathMatchers("/api/users/profile").authenticated()

                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .jwtDecoder(reactiveJwtDecoder())
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                )
                .addFilterAfter(jwtHeaderInjectionFilter(), SecurityWebFiltersOrder.AUTHENTICATION)
                .build();
    }

    /**
     * ✅ JWT Decoder
     * "shopflow-super-secret-key-must-be-256-bits-long!" = 47 chars = 376 bits
     * JJWT auto-selects HS384 for 256-511 bit keys → HmacSHA384 use karo
     */
    @Bean
    public ReactiveJwtDecoder reactiveJwtDecoder() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        SecretKey secretKey = new SecretKeySpec(keyBytes, "HmacSHA384");
        return NimbusReactiveJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS384)
                .build();
    }

    /**
     * ✅ JWT → Spring Security Authorities converter
     * JWT claim "role": "ADMIN" → GrantedAuthority: "ROLE_ADMIN"
     * JWT claim "role": "USER"  → GrantedAuthority: "ROLE_USER"
     */
    @Bean
    public Converter<Jwt, Mono<AbstractAuthenticationToken>> jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            String role = jwt.getClaimAsString("role");
            if (role == null || role.isBlank()) return List.of();
            String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
            return List.of(new SimpleGrantedAuthority(authority));
        });
        return new ReactiveJwtAuthenticationConverterAdapter(converter);
    }

    /**
     * ✅ Downstream Header Injection Filter
     * JWT se email + role nikal ke headers add karo taaki product-service use kar sake
     */
    @Bean
    public WebFilter jwtHeaderInjectionFilter() {
        return (ServerWebExchange exchange, WebFilterChain chain) ->
                exchange.getPrincipal()
                        .filter(p -> p instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken)
                        .cast(org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken.class)
                        .flatMap(jwtAuth -> {
                            Jwt jwt = jwtAuth.getToken();
                            String email = jwt.getSubject();
                            String role  = jwt.getClaimAsString("role");
                            ServerWebExchange mutated = exchange.mutate()
                                    .request(r -> r
                                            .header("X-User-Email", email != null ? email : "")
                                            .header("X-User-Role",  role  != null ? role  : "USER")
                                    )
                                    .build();
                            return chain.filter(mutated);
                        })
                        .switchIfEmpty(chain.filter(exchange));
    }

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "https://*.netlify.app",
                "https://*.railway.app",
                "https://*.render.com",
                "https://*.vercel.app"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsWebFilter(source);
    }
}
