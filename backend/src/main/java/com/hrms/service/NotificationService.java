package com.hrms.service;

import com.hrms.dto.response.*;
import com.hrms.entity.*;
import com.hrms.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;

    public void createNotification(User user, String message) {
        Notification notif = Notification.builder()
                .user(user)
                .message(message)
                .build();
        notificationRepository.save(notif);
    }

    public Page<NotificationResponse> getMyNotifications(int page, int size) {
        User user = userService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository
                .findByUserOrderByCreatedAtDesc(user, pageable)
                .map(this::toResponse);
    }

    public long getUnreadCount() {
        User user = userService.getCurrentUser();
        return notificationRepository.countByUserAndReadFalse(user);
    }

    public ApiResponse<String> markAllRead() {
        User user = userService.getCurrentUser();
        notificationRepository.findByUserOrderByCreatedAtDesc(user, Pageable.unpaged())
                .forEach(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
        return ApiResponse.ok("All notifications marked as read");
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .message(n.getMessage())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
