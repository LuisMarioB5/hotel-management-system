package com.hotel_management.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record AuthDTO(
        @NotBlank
        String username,

        @NotBlank
        String password) {}
