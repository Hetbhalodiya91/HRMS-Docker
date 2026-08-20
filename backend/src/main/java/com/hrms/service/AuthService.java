package com.hrms.service;

import com.hrms.dto.request.*;
import com.hrms.dto.response.*;
import com.hrms.email.EmailService;
import com.hrms.entity.*;
import com.hrms.exception.*;
import com.hrms.repository.*;
import com.hrms.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final EmailVerificationTokenRepository verificationTokenRepo;
    private final PasswordResetTokenRepository passwordResetTokenRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.email-verification-expiry}")
    private int emailVerificationExpiryMinutes;

    @Value("${app.password-reset-expiry}")
    private int passwordResetExpiryMinutes;

    public ApiResponse<String> register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        Role employeeRole = roleRepository.findByName(Role.RoleName.EMPLOYEE)
                .orElseThrow(() -> new ResourceNotFoundException("Default role not found"));

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .enabled(false)
                .build();

        user.getRoles().add(employeeRole);

        if (req.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(req.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", req.getDepartmentId()));
            user.setDepartment(dept);
        }

        userRepository.save(user);

        // Send verification email
        String token = UUID.randomUUID().toString();
        EmailVerificationToken verToken = EmailVerificationToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(emailVerificationExpiryMinutes))
                .used(false)
                .build();
        verificationTokenRepo.save(verToken);
        emailService.sendVerificationEmail(user.getEmail(), user.getName(), token);

        // Notify admins
        List<User> admins = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream()
                        .anyMatch(r -> r.getName() == Role.RoleName.ADMIN))
                .toList();
        admins.forEach(admin ->
                emailService.sendNewUserNotificationToAdmin(
                        admin.getEmail(), admin.getName(), user.getName(), user.getEmail()));

        return ApiResponse.ok("Registration successful. Check your email to verify your account.");
    }

    public ApiResponse<AuthResponse> login(LoginRequest req) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isEnabled()) {
            throw new UnauthorizedException("Email not verified. Check your inbox.");
        }
        if (!user.isActive()) {
            throw new UnauthorizedException("Account has been disabled. Contact admin.");
        }

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(),
                user.getRoles().stream()
                        .map(r -> new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "ROLE_" + r.getName().name()))
                        .collect(Collectors.toSet()));

        String jwt = jwtUtil.generateToken(userDetails);

        Set<String> roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet());

        AuthResponse auth = AuthResponse.builder()
                .token(jwt)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .roles(roles)
                .departmentName(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .build();

        return ApiResponse.ok("Login successful", auth);
    }

    public ApiResponse<String> verifyEmail(String token) {
        EmailVerificationToken verToken = verificationTokenRepo.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        if (verToken.isUsed()) throw new BadRequestException("Token already used");
        if (verToken.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new BadRequestException("Verification token expired");

        User user = verToken.getUser();
        user.setEnabled(true);
        userRepository.save(user);

        verToken.setUsed(true);
        verificationTokenRepo.save(verToken);

        return ApiResponse.ok("Email verified successfully. You can now log in.");
    }

    public ApiResponse<String> forgotPassword(ForgotPasswordRequest req) {
        userRepository.findByEmail(req.getEmail()).ifPresent(user -> {
            passwordResetTokenRepo.deleteByUserId(user.getId());
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(token)
                    .user(user)
                    .expiresAt(LocalDateTime.now().plusMinutes(passwordResetExpiryMinutes))
                    .build();
            passwordResetTokenRepo.save(resetToken);
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), token);
        });
        return ApiResponse.ok("If the email exists, a reset link has been sent.");
    }

    public ApiResponse<String> resetPassword(ResetPasswordRequest req) {
        PasswordResetToken resetToken = passwordResetTokenRepo.findByToken(req.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid reset token"));

        if (resetToken.isUsed()) throw new BadRequestException("Token already used");
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new BadRequestException("Reset token expired. Please request a new one.");

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepo.save(resetToken);

        return ApiResponse.ok("Password reset successfully. You can now log in.");
    }
}
