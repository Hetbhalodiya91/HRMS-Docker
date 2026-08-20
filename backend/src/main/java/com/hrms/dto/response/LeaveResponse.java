package com.hrms.dto.response;

import com.hrms.entity.LeaveRequest;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LeaveResponse {
    private Long id;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private LeaveRequest.LeaveStatus status;
    private LeaveRequest.LeaveType leaveType;
    private String appliedByName;
    private Long appliedById;
    private String appliedByEmail;
    private String reviewedByName;
    private String reviewComment;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private long totalDays;
}
