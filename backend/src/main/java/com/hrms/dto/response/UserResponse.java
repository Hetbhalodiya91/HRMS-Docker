package com.hrms.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private boolean enabled;
    private boolean active;
    private Set<String> roles;
    private String departmentName;
    private Long departmentId;
    private LocalDateTime createdAt;
}
