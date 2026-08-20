package com.hrms.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
//@Configuration → tells Spring: “this is a config file”
//@EnableWebSecurity → activates Spring Security
//@EnableMethodSecurity → allows:
//@PreAuthorize("hasRole('ADMIN')")
//@RequiredArgsConstructor → Lombok auto-injects:
//private final JwtFilter jwtFilter;
//private final CustomUserDetailsService userDetailsService;
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
// ❌ CSRF Disabled
//Needed because you're using JWT (stateless)
//CSRF is for session-based apps
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
//                Allows frontend (localhost:5173) to talk to backend (8090)
//Without this → browser blocks request 🚫
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//                Tell Spring Security: "Don't create sessions, we're stateless"
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/**",
                    "/api/auth/verify-email",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password",
                        "/api/departments"
                ).permitAll()
//                    Allow unauthenticated access to auth endpoints & departments
                .anyRequest().authenticated()
//                    All other endpoints require authentication
            )
            .authenticationProvider(authenticationProvider())
//                Tell Spring Security to use our custom authentication provider (which uses our UserDetailsService)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
//                Add our JWT filter before Spring's default username/password filter
        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(
    "http://localhost:5173",
    "http://localhost:3000"
));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
