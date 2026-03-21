package com.ctse.authservice.config;

import com.ctse.authservice.model.User;
import com.ctse.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.username:admin}")
    private String adminUsername;

    @Value("${admin.email:admin@mail.com}")
    private String adminEmail;

    @Value("${admin.password:admin@1234}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        log.info("Checking for existing admin user...");
        Optional<User> existingAdmin = userRepository.findByUsername(adminUsername);
        
        if (existingAdmin.isEmpty()) {
            log.info("No default admin found. Creating admin user: {}", adminUsername);
            User admin = User.builder()
                    .username(adminUsername)
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .roles("ROLE_USER,ROLE_ADMIN")
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created successfully.");
        } else {
            log.info("Admin user already exists. Skipping seeding.");
        }
    }
}
