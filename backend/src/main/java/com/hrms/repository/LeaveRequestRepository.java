package com.hrms.repository;

import com.hrms.entity.LeaveRequest;
import com.hrms.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    Page<LeaveRequest> findByAppliedBy(User user, Pageable pageable);

    Page<LeaveRequest> findByStatus(LeaveRequest.LeaveStatus status, Pageable pageable);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.appliedBy.department.id = :deptId")
    Page<LeaveRequest> findByDepartmentId(Long deptId, Pageable pageable);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.appliedBy.department.id = :deptId " +
           "AND lr.status = :status")
    Page<LeaveRequest> findByDepartmentIdAndStatus(Long deptId,
                                                    LeaveRequest.LeaveStatus status,
                                                    Pageable pageable);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.appliedBy = :user " +
           "AND lr.status = 'APPROVED' " +
           "AND ((lr.startDate BETWEEN :start AND :end) OR (lr.endDate BETWEEN :start AND :end))")
    List<LeaveRequest> findOverlappingLeaves(User user, LocalDate start, LocalDate end);

    long countByAppliedByAndStatus(User user, LeaveRequest.LeaveStatus status);
}
