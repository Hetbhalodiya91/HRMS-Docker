package com.hrms.service;

import com.hrms.dto.request.UpdateUserRequest;
import com.hrms.dto.response.*;
import com.hrms.entity.*;
import com.hrms.exception.*;
import com.hrms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }

    public UserResponse getCurrentUserProfile() { return toResponse(getCurrentUser());}

    public Page<UserResponse> getAllUsers(String search, int page, int size, String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());
        Page<User> users = (search != null && !search.isBlank())
                ? userRepository.searchActiveUsers(search, pageable)
                : userRepository.findByActiveTrue(pageable);
        return users.map(this::toResponse);
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return toResponse(user);
    }

    public UserResponse updateUser(Long id, UpdateUserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        if (user.getName().equals("System Admin")) {
            throw new BadRequestException("Cannot modify System Admin account");
        }
        if (user.getId().equals(getCurrentUser().getId())) {
            throw new BadRequestException("You cannot modify your own account");
        }

        if (req.getName() != null) user.setName(req.getName());

        if (req.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(req.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", req.getDepartmentId()));
            user.setDepartment(dept);
        }

        if (req.getRoles() != null && !req.getRoles().isEmpty()) {
            Set<Role> roles = req.getRoles().stream()
                    .map(roleName -> roleRepository.findByName(Role.RoleName.valueOf(roleName))
                            .orElseThrow(() -> new BadRequestException("Role not found: " + roleName)))
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        }

        return toResponse(userRepository.save(user));
    }

    public ApiResponse<String> disableUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        if (user.getName().equals("System Admin")) {
            throw new BadRequestException("Cannot disable System Admin account");
        }
        if(user.getId().equals(getCurrentUser().getId())) {
            throw new BadRequestException("You cannot disable your own account");
        }


        user.setActive(false);
        userRepository.save(user);
        return ApiResponse.ok("User disabled successfully");
    }

    public ApiResponse<String> enableUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setActive(true);
        userRepository.save(user);
        return ApiResponse.ok("User enabled successfully");
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .enabled(user.isEnabled())
                .active(user.isActive())
                .roles(user.getRoles().stream()
                        .map(r -> r.getName().name())
                        .collect(Collectors.toSet()))
                .departmentName(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
