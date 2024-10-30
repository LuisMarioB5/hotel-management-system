package com.hotel_management.backend.dto.employee;

import com.hotel_management.backend.dto.person.ShowPersonDTO;
import com.hotel_management.backend.model.EmployeeEntity;

public record ShowEmployeeDTO(
        Long id,

        Double salary,

        Boolean isActive,

        ShowPersonDTO personDTO) {
    public ShowEmployeeDTO(EmployeeEntity employee){
        this(employee.getId(),
             employee.getSalary(),
             employee.getIsActive(),
             employee.getPersonEntity() != null
                     ? new ShowPersonDTO(employee.getPersonEntity())
                     : null
        );
    }
}
