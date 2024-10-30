package com.hotel_management.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserDTO(

        @NotNull(message = "El id del empleado no puede ser nulo")
        Long idEmployee,

        String role,

        /*
         * Validación del nombre de usuario.
         * Requisitos:
         * - Longitud de 3 a 15 caracteres.
         * - Solo permite letras, números, guiones bajos (_) y puntos (.).
         * - Debe ser único en la base de datos.
         */
        @NotBlank(message = "El nombre de usuario no debe estar vacío")
        @Size(min = 3, max = 15, message = "El nombre de usuario debe tener entre 3 y 15 caracteres")
        @Pattern(
                regexp = "^[A-Za-z0-9._]+$",
                message = "El nombre de usuario solo puede contener letras, números, puntos y guiones bajos"
        )
        String username,

        /*
         * Clave del usuario.
         *
         * Reglas de validación:
         * - Debe tener al menos 8 caracteres y maximo 255 caracteres.
         * - Debe incluir al menos una letra minúscula.
         * - Debe incluir al menos una letra mayúscula.
         * - Debe contener al menos un número.
         * - Debe incluir al menos un carácter especial, como: @, $, !, %, *, ?, &.
         *
         * Esta validación asegura que la clave cumpla con los estándares de seguridad mínimos requeridos.
         */
        @NotBlank(message = "La clave no debe estar vacía")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,255}$",
                message = "La clave debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial"
        )
        String password,

        Boolean isActive) {
        
}
