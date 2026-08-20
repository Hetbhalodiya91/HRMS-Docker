package com.hrms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrms.email.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiSmokeTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // Prevent real emails from being sent during tests
    @MockBean
    private EmailService emailService;

    private String adminJwt;

    @BeforeEach
    void obtainAdminToken() throws Exception {
        if (adminJwt != null) {
            return;
        }

        String loginPayload = """
            {
              "email": "admin@hrms.com",
              "password": "Admin@123"
            }
            """;

        MvcResult result = mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(APPLICATION_JSON)
                                .content(loginPayload))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(body);
        JsonNode dataNode = root.path("data");

        adminJwt = dataNode.path("token").asText();
        assertThat(adminJwt).isNotBlank();
    }

    @Test
    void authEndpointsAreReachable() throws Exception {
        // Forgot password should always return 200, even for unknown email
        String forgotPayload = """
            {
              "email": "unknown@example.com"
            }
            """;

        mockMvc.perform(
                        post("/api/auth/forgot-password")
                                .contentType(APPLICATION_JSON)
                                .content(forgotPayload))
                .andExpect(status().isOk());
    }

    @Test
    void userAndDepartmentApisRespondWithJwt() throws Exception {
        String bearer = "Bearer " + adminJwt;

        // Current user profile
        mockMvc.perform(
                        get("/api/users/me")
                                .header("Authorization", bearer))
                .andExpect(status().isOk());

        // Departments list
        mockMvc.perform(
                        get("/api/departments")
                                .header("Authorization", bearer))
                .andExpect(status().isOk());
    }

    @Test
    void leaveAndNotificationApisRespondWithJwt() throws Exception {
        String bearer = "Bearer " + adminJwt;

        // My leaves
        mockMvc.perform(
                        get("/api/leaves/my")
                                .header("Authorization", bearer))
                .andExpect(status().isOk());

        // Notifications count
        mockMvc.perform(
                        get("/api/notifications/unread-count")
                                .header("Authorization", bearer))
                .andExpect(status().isOk());
    }
}

