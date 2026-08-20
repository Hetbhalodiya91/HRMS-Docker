package com.hrms.config;

import com.hrms.entity.*;
import com.hrms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j


public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Seed roles
        for (Role.RoleName roleName : Role.RoleName.values()) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                roleRepository.save(new Role(null, roleName));
                log.info("Created role: {}", roleName);
            }
        }

        // Seed default admin
        if (!userRepository.existsByEmail("admin@hrms.com")) {
            Role adminRole = roleRepository.findByName(Role.RoleName.ADMIN).orElseThrow();
            User admin = User.builder()
                    .name("System Admin")
                    .email("admin@hrms.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .enabled(true)
                    .active(true)
                    .roles(Set.of(adminRole))
                    .build();
            userRepository.save(admin);
            log.info("Default admin created: admin@hrms.com / Admin@123");
        }
    }
}

//Application starts
//        ↓
//Spring loads this class
//        ↓
//run() method executes
//        ↓
//Check roles → create if missing
//        ↓
//Check admin → create if missing
//        ↓
//Database is initialized