package com.hotel_management.backend.dto.user;

import com.hotel_management.backend.dto.employee.ShowEmployeeDTO;
import com.hotel_management.backend.model.UserEntity;

public record ShowUserDTO(
        Long id,

        String role,

        String username,

//    String password,

        Boolean isActive,

        ShowEmployeeDTO employeeDTO) {
    public ShowUserDTO (UserEntity user){
        this(user.getId(),
             user.getRole().getDisplayName(),
             user.getUsername(),
//             user.getPassword(),
             user.getIsActive(),
             user.getEmployeeEntity() != null
                ? new ShowEmployeeDTO(user.getEmployeeEntity())
                : null
        );
    }
}
