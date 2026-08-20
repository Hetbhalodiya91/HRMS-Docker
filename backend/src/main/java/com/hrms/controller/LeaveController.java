package com.hrms.controller;

import com.hrms.dto.request.*;
import com.hrms.dto.response.*;
import com.hrms.entity.LeaveRequest;
import com.hrms.service.LeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    // Employee: Apply for leave
    @PostMapping("/apply")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<LeaveResponse>> applyLeave(
            @Valid @RequestBody LeaveApplyRequest req) {
        return ResponseEntity.ok(leaveService.applyLeave(req));
    }

    // Employee: My leave history
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<LeaveResponse>>> getMyLeaves(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Leaves fetched", leaveService.getMyLeaves(page, size)));
    }

    // Employee: Cancel pending leave
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<String>> cancelLeave(@PathVariable Long id) {
        return ResponseEntity.ok(leaveService.cancelLeave(id));
    }

    // Manager: View department leaves
    @GetMapping("/department")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<Page<LeaveResponse>>> getDepartmentLeaves(
            @RequestParam(required = false) LeaveRequest.LeaveStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Department leaves fetched",
                leaveService.getDepartmentLeaves(status, page, size)));
    }

    // Manager: Approve or Reject
    @PatchMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<LeaveResponse>> reviewLeave(
            @PathVariable Long id, @Valid @RequestBody LeaveReviewRequest req) {
        return ResponseEntity.ok(leaveService.reviewLeave(id, req));
    }

    // Admin: All leaves
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<LeaveResponse>>> getAllLeaves(
            @RequestParam(required = false) LeaveRequest.LeaveStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok("All leaves fetched",
                leaveService.getAllLeaves(status, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LeaveResponse>> getLeaveById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Leave fetched", leaveService.getLeaveById(id)));
    }
}
