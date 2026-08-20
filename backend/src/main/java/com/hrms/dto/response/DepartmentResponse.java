package com.hrms.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DepartmentResponse {
    private Long id;
    private String name;
    private String description;
    private int totalEmployees;
}
