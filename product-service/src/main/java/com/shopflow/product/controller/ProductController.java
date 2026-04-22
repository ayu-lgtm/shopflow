package com.shopflow.product.controller;

import com.shopflow.product.dto.ProductDto;
import com.shopflow.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // ── PUBLIC endpoints ────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<ProductDto.ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto.ProductResponse> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductDto.ProductResponse>> search(@RequestParam String name) {
        return ResponseEntity.ok(productService.searchProducts(name));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "product-service"));
    }

    // ── ADMIN-only endpoints (Gateway already enforces ROLE_ADMIN) ──────────
    // X-User-Email and X-User-Role are injected by Gateway from JWT claims

    @PostMapping
    public ResponseEntity<ProductDto.ProductResponse> createProduct(
            @Valid @RequestBody ProductDto.CreateRequest request,
            @RequestHeader(value = "X-User-Email", defaultValue = "unknown") String userEmail,
            @RequestHeader(value = "X-User-Role",  defaultValue = "USER")    String userRole) {
        log.info("Product create request by {} (role={})", userEmail, userRole);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.createProduct(request, userEmail));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDto.ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductDto.CreateRequest request,
            @RequestHeader(value = "X-User-Email", defaultValue = "unknown") String userEmail) {
        log.info("Product update request: id={} by {}", id, userEmail);
        return ResponseEntity.ok(productService.updateProduct(id, request, userEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteProduct(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Email", defaultValue = "unknown") String userEmail) {
        log.info("Product delete request: id={} by {}", id, userEmail);
        productService.deleteProduct(id);
        return ResponseEntity.ok(Map.of("message", "Product deleted", "id", id.toString(), "deletedBy", userEmail));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleError(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
