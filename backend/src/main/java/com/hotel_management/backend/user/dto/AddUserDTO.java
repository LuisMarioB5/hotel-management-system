package com.hotel_management.backend.user.dto;

import jakarta.validation.constraints.NotBlank;

public record AddUserDTO(
        @NotBlank
        String username,

        @NotBlank
        String password,

        String role,

        Boolean isActive) {}
