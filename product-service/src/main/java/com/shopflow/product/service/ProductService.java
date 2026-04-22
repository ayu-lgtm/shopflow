package com.shopflow.product.service;

import com.shopflow.product.config.UserServiceClient;
import com.shopflow.product.dto.ProductDto;
import com.shopflow.product.model.Product;
import com.shopflow.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserServiceClient userServiceClient;

    public List<ProductDto.ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProductDto.ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));
        return toResponse(product);
    }

    public List<ProductDto.ProductResponse> searchProducts(String name) {
        return productRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductDto.ProductResponse createProduct(ProductDto.CreateRequest request, String creatorEmail) {
        // ✅ SYNC Feign call — validate creator exists in user-service
        log.info("Validating creator via Feign: {}", creatorEmail);
        try {
            Map<String, Boolean> validation = userServiceClient.validateUser(creatorEmail);
            if (!Boolean.TRUE.equals(validation.get("exists"))) {
                throw new RuntimeException("Creator user not found: " + creatorEmail);
            }
        } catch (RuntimeException e) {
            throw e; // re-throw validation failures
        } catch (Exception e) {
            log.warn("Feign call to user-service failed (continuing): {}", e.getMessage());
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock() != null ? request.getStock() : 0)
                .category(request.getCategory())
                .lastModifiedBy(creatorEmail)
                .build();

        Product saved = productRepository.save(product);
        log.info("Product created: id={} name={} by={}", saved.getId(), saved.getName(), creatorEmail);
        return toResponse(saved);
    }

    @Transactional
    public ProductDto.ProductResponse updateProduct(Long id, ProductDto.CreateRequest request, String updaterEmail) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock() != null ? request.getStock() : product.getStock());
        product.setCategory(request.getCategory());
        product.setUpdatedAt(LocalDateTime.now());
        product.setLastModifiedBy(updaterEmail);

        Product updated = productRepository.save(product);
        log.info("Product updated: id={} by={}", updated.getId(), updaterEmail);
        return toResponse(updated);
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found: " + id);
        }
        productRepository.deleteById(id);
        log.info("Product deleted: id={}", id);
    }

    private ProductDto.ProductResponse toResponse(Product p) {
        return new ProductDto.ProductResponse(
                p.getId(), p.getName(), p.getDescription(),
                p.getPrice(), p.getStock(), p.getCategory()
        );
    }
}
