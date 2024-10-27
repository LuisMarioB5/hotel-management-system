package com.hotel_management.backend.dto.user;

import jakarta.validation.constraints.NotBlank;

public record AddUserDTO(
        @NotBlank
        String username,

        @NotBlank
        String password,

        String role,

        Boolean isActive) {}
