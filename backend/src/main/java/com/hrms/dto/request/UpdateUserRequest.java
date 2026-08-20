package com.hrms.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.Set;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateUserRequest {
    @Size(min = 2, max = 50)
    private String name;

    private Long departmentId;

    private Set<String> roles;   // "ADMIN", "MANAGER", "EMPLOYEE"
}
