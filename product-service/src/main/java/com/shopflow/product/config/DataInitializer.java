package com.shopflow.product.config;

import com.shopflow.product.model.Product;
import com.shopflow.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Override
    public void run(String... args) {
        if (productRepository.count() == 0) {
            productRepository.save(Product.builder()
                .name("Laptop Pro").description("High performance laptop")
                .price(new BigDecimal("75000")).stock(10).category("Electronics").build());

            productRepository.save(Product.builder()
                .name("Wireless Mouse").description("Ergonomic wireless mouse")
                .price(new BigDecimal("1500")).stock(50).category("Electronics").build());

            productRepository.save(Product.builder()
                .name("Cotton T-Shirt").description("Comfortable cotton t-shirt")
                .price(new BigDecimal("599")).stock(100).category("Clothing").build());

            productRepository.save(Product.builder()
                .name("Running Shoes").description("Lightweight running shoes")
                .price(new BigDecimal("3500")).stock(30).category("Footwear").build());

            productRepository.save(Product.builder()
                .name("Coffee Mug").description("Ceramic coffee mug 350ml")
                .price(new BigDecimal("299")).stock(75).category("Kitchen").build());

            log.info("Sample products loaded!");
        }
    }
}
