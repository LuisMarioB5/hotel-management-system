package com.hotel_management.backend.security;

import jakarta.validation.constraints.NotBlank;

public record AuthDTO(
        @NotBlank
        String username,

        @NotBlank
        String password) {}
