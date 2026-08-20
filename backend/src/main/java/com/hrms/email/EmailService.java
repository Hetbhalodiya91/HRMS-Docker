package com.hrms.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Async
    public void sendVerificationEmail(String toEmail, String name, String token) {
        Context ctx = new Context();
        ctx.setVariable("name", name);
        ctx.setVariable("verifyUrl", frontendUrl + "/verify-email?token=" + token);
        sendEmail(toEmail, "Verify Your Email - HRMS", "email-verification", ctx);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String name, String token) {
        Context ctx = new Context();
        ctx.setVariable("name", name);
        ctx.setVariable("resetUrl", frontendUrl + "/reset-password?token=" + token);
        ctx.setVariable("expiryMinutes", 15);
        sendEmail(toEmail, "Password Reset Request - HRMS", "password-reset", ctx);
    }

    @Async
    public void sendLeaveSubmittedEmail(String toEmail, String managerName,
                                         String employeeName, String leaveType,
                                         String startDate, String endDate) {
        Context ctx = new Context();
        ctx.setVariable("managerName", managerName);
        ctx.setVariable("employeeName", employeeName);
        ctx.setVariable("leaveType", leaveType);
        ctx.setVariable("startDate", startDate);
        ctx.setVariable("endDate", endDate);
        sendEmail(toEmail, "New Leave Request - " + employeeName, "leave-submitted", ctx);
    }

    @Async
    public void sendLeaveDecisionEmail(String toEmail, String employeeName,
                                        String decision, String leaveType,
                                        String startDate, String endDate, String comment) {
        Context ctx = new Context();
        ctx.setVariable("employeeName", employeeName);
        ctx.setVariable("decision", decision);
        ctx.setVariable("leaveType", leaveType);
        ctx.setVariable("startDate", startDate);
        ctx.setVariable("endDate", endDate);
        ctx.setVariable("comment", comment);
        ctx.setVariable("approved", "APPROVED".equals(decision));
        sendEmail(toEmail, "Leave Request " + decision + " - HRMS", "leave-decision", ctx);
    }

    @Async
    public void sendNewUserNotificationToAdmin(String adminEmail, String adminName,
                                                String newUserName, String newUserEmail) {
        Context ctx = new Context();
        ctx.setVariable("adminName", adminName);
        ctx.setVariable("newUserName", newUserName);
        ctx.setVariable("newUserEmail", newUserEmail);
        ctx.setVariable("usersUrl", frontendUrl + "/admin/users");
        sendEmail(adminEmail, "New Employee Registered - HRMS", "admin-new-user", ctx);
    }

    private void sendEmail(String to, String subject, String template, Context context) {
        try {
            String html = templateEngine.process(template, context);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email sent to {} - Subject: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
