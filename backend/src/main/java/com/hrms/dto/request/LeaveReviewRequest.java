package com.hrms.dto.request;

import com.hrms.entity.LeaveRequest;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LeaveReviewRequest {
    @NotNull(message = "Decision is required")
    private LeaveRequest.LeaveStatus decision;   // APPROVED or REJECTED

    @Size(max = 500, message = "Comment max 500 characters")
    private String comment;
}
