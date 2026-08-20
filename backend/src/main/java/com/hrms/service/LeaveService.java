package com.hrms.service;

import com.hrms.dto.request.*;
import com.hrms.dto.response.*;
import com.hrms.email.EmailService;
import com.hrms.entity.*;
import com.hrms.exception.*;
import com.hrms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LeaveService {

    private final LeaveRequestRepository leaveRepo;
    private final UserService userService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public ApiResponse<LeaveResponse> applyLeave(LeaveApplyRequest req) {
        User employee = userService.getCurrentUser();

        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new BadRequestException("End date cannot be before start date");
        }

        List<LeaveRequest> overlaps = leaveRepo.findOverlappingLeaves(
                employee, req.getStartDate(), req.getEndDate());
        if (!overlaps.isEmpty()) {
            throw new BadRequestException("You already have an approved leave overlapping these dates");
        }

        LeaveRequest leave = LeaveRequest.builder()
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .reason(req.getReason())
                .leaveType(req.getLeaveType())
                .appliedBy(employee)
                .build();

        LeaveRequest saved = leaveRepo.save(leave);

        // Notify managers in the same department
        if (employee.getDepartment() != null) {
            userRepository.findAll().stream()
                    .filter(u -> u.isActive() && u.isEnabled()
                            && u.getDepartment() != null
                            && u.getDepartment().getId().equals(employee.getDepartment().getId())
                            && u.getRoles().stream().anyMatch(r -> r.getName() == Role.RoleName.MANAGER))
                    .forEach(manager -> {
                        notificationService.createNotification(manager,
                                employee.getName() + " applied for " + req.getLeaveType() + " leave");
                        emailService.sendLeaveSubmittedEmail(
                                manager.getEmail(), manager.getName(),
                                employee.getName(), req.getLeaveType().name(),
                                req.getStartDate().toString(), req.getEndDate().toString());
                    });
        }

        return ApiResponse.ok("Leave applied successfully", toResponse(saved));
    }

    public ApiResponse<LeaveResponse> reviewLeave(Long leaveId, LeaveReviewRequest req) {
        User reviewer = userService.getCurrentUser();
        LeaveRequest leave = leaveRepo.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request", leaveId));

        if (leave.getStatus() != LeaveRequest.LeaveStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be reviewed");
        }
        if (req.getDecision() != LeaveRequest.LeaveStatus.APPROVED
                && req.getDecision() != LeaveRequest.LeaveStatus.REJECTED) {
            throw new BadRequestException("Decision must be APPROVED or REJECTED");
        }

        leave.setStatus(req.getDecision());
        leave.setReviewedBy(reviewer);
        leave.setReviewComment(req.getComment());
        leave.setReviewedAt(LocalDateTime.now());

        LeaveRequest saved = leaveRepo.save(leave);

        // Notify employee
        User employee = leave.getAppliedBy();
        String msg = "Your leave request (" + leave.getLeaveType() + ") has been " + req.getDecision().name();
        notificationService.createNotification(employee, msg);
        emailService.sendLeaveDecisionEmail(
                employee.getEmail(), employee.getName(),
                req.getDecision().name(), leave.getLeaveType().name(),
                leave.getStartDate().toString(), leave.getEndDate().toString(),
                req.getComment());

        return ApiResponse.ok("Leave " + req.getDecision().name().toLowerCase() + " successfully", toResponse(saved));
    }

    public ApiResponse<String> cancelLeave(Long leaveId) {
        User currentUser = userService.getCurrentUser();
        LeaveRequest leave = leaveRepo.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request", leaveId));

        if (!leave.getAppliedBy().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only cancel your own leave requests");
        }
        if (leave.getStatus() != LeaveRequest.LeaveStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be cancelled");
        }

        leave.setStatus(LeaveRequest.LeaveStatus.CANCELLED);
        leaveRepo.save(leave);
        return ApiResponse.ok("Leave request cancelled");
    }

    public Page<LeaveResponse> getMyLeaves(int page, int size) {
        User user = userService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return leaveRepo.findByAppliedBy(user, pageable).map(this::toResponse);
    }

    public Page<LeaveResponse> getDepartmentLeaves(LeaveRequest.LeaveStatus status, int page, int size) {
        User manager = userService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        if (manager.getDepartment() == null) {
            // If the current user is an admin without a department, fall back to all leaves
            boolean isAdmin = manager.getRoles().stream()
                    .anyMatch(r -> r.getName() == Role.RoleName.ADMIN);
            if (isAdmin) {
                return getAllLeaves(status, page, size);
            }
            throw new BadRequestException("You are not assigned to any department");
        }

        if (status != null) {
            return leaveRepo.findByDepartmentIdAndStatus(
                    manager.getDepartment().getId(), status, pageable).map(this::toResponse);
        }
        return leaveRepo.findByDepartmentId(
                manager.getDepartment().getId(), pageable).map(this::toResponse);
    }

    public Page<LeaveResponse> getAllLeaves(LeaveRequest.LeaveStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (status != null) {
            return leaveRepo.findByStatus(status, pageable).map(this::toResponse);
        }
        return leaveRepo.findAll(pageable).map(this::toResponse);
    }

    public LeaveResponse getLeaveById(Long id) {
        return toResponse(leaveRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request", id)));
    }

    private LeaveResponse toResponse(LeaveRequest lr) {
        long days = ChronoUnit.DAYS.between(lr.getStartDate(), lr.getEndDate()) + 1;
        return LeaveResponse.builder()
                .id(lr.getId())
                .startDate(lr.getStartDate())
                .endDate(lr.getEndDate())
                .reason(lr.getReason())
                .status(lr.getStatus())
                .leaveType(lr.getLeaveType())
                .appliedByName(lr.getAppliedBy().getName())
                .appliedById(lr.getAppliedBy().getId())
                .appliedByEmail(lr.getAppliedBy().getEmail())
                .reviewedByName(lr.getReviewedBy() != null ? lr.getReviewedBy().getName() : null)
                .reviewComment(lr.getReviewComment())
                .createdAt(lr.getCreatedAt())
                .reviewedAt(lr.getReviewedAt())
                .totalDays(days)
                .build();
    }
}
