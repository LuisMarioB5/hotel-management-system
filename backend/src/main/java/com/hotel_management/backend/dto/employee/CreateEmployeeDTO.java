package com.hotel_management.backend.dto.employee;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateEmployeeDTO(
        @NotNull(message = "El idPerson (id de la persona) no puede ser nulo")
        Long idPerson,

        @NotNull(message = "El sueldo del empleado no puede ser nulo")
        @Positive(message = "El sueldo del empleado debe ser un valor positivo")
        Double salary,

        Boolean isActive
) {
}
