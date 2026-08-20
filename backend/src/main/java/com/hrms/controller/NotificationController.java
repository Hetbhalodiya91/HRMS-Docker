package com.hrms.controller;

import com.hrms.dto.response.*;
import com.hrms.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Notifications fetched",
                notificationService.getMyNotifications(page, size)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        return ResponseEntity.ok(ApiResponse.ok("Unread count", notificationService.getUnreadCount()));
    }

    @PatchMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<String>> markAllRead() {
        return ResponseEntity.ok(notificationService.markAllRead());
    }
}
