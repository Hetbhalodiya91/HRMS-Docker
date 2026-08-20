package com.hrms.service;

import com.hrms.dto.request.DepartmentRequest;
import com.hrms.dto.response.*;
import com.hrms.entity.Department;
import com.hrms.exception.*;
import com.hrms.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::toResponse).toList();
    }

    public DepartmentResponse getDepartmentById(Long id) {
        return toResponse(departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id)));
    }

    public DepartmentResponse createDepartment(DepartmentRequest req) {
        if (departmentRepository.existsByName(req.getName())) {
            throw new BadRequestException("Department already exists: " + req.getName());
        }
        Department dept = Department.builder()
                .name(req.getName())
                .description(req.getDescription())
                .build();
        return toResponse(departmentRepository.save(dept));
    }

    public DepartmentResponse updateDepartment(Long id, DepartmentRequest req) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        dept.setName(req.getName());
        dept.setDescription(req.getDescription());
        return toResponse(departmentRepository.save(dept));
    }

    public ApiResponse<String> deleteDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        if (!dept.getUsers().isEmpty()) {
            throw new BadRequestException("Cannot delete department with assigned employees");
        }
        departmentRepository.delete(dept);
        return ApiResponse.ok("Department deleted successfully");
    }

    private DepartmentResponse toResponse(Department dept) {
        int totalEmployees = dept.getUsers() != null ? dept.getUsers().size() : 0;
        return DepartmentResponse.builder()
                .id(dept.getId())
                .name(dept.getName())
                .description(dept.getDescription())
                .totalEmployees(totalEmployees)
                .build();
    }
}
