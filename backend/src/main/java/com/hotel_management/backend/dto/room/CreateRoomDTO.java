package com.hotel_management.backend.dto.room;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateRoomDTO(
        @NotNull(message = "El número de la habitación no puede ser nulo")
        Long roomNumber,

        @NotBlank(message = "El número de la habitación no puede estar vacío")
        String category,

        @NotBlank(message = "El estado de la habitación no puede estar vacío")
        String state,

        @NotNull(message = "El precio de la habitación por noche no puede ser nulo")
        @Positive(message = "El precio de la habitación no puede ser negativo")
        Double pricePerNight,

        @NotBlank(message = "El piso de la habitación no puede estar vacío")
        String floor,

        String details,

        Boolean isActive) {
}
