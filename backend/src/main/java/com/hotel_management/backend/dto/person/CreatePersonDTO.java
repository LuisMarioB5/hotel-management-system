package com.hotel_management.backend.dto.person;

import jakarta.validation.constraints.*;

public record CreatePersonDTO(
        @NotBlank(message = "El nombre no debe estar vacío")
        @Size(max = 50, message = "El nombre no puede exceder 50 caracteres")
        String name,

        @NotBlank(message = "El apellido no debe estar vacío")
        @Size(max = 50, message = "El apellido no puede exceder 50 caracteres")
        String lastName,

        @NotBlank(message = "El género no debe estar vacío")
        String gender,

        @NotBlank(message = "El teléfono no debe estar vacío")
        @Pattern(regexp = "^(\\+\\d)?\\d{3}-?\\d{3}-?\\d{4}$", message = "Formato del número de teléfono no válido")
        String phoneNumber,

        @NotBlank(message = "La dirección no debe estar vacía")
        @Size(max = 150, message = "La dirección no puede exceder 150 caracteres")
        String address,

        @NotNull(message = "La fecha de nacimiento no debe estar vacía")
        @Pattern(regexp = "\\d{2}-\\d{2}-\\d{4}", message = "Formato de la fecha de nacimiento no válido. Debe ser dd-MM-yyyy")
        String birthDate,

        @NotBlank(message = "El tipo de documento no debe estar vacío")
        String typeDocument,

        @NotBlank(message = "El número del documento no debe estar vacío")
        String documentNumber,

        @NotBlank(message = "El email no debe estar vacío")
        @Email(message = "El email tiene un formato inválido")
        String email,

        Boolean isActive) {

}
