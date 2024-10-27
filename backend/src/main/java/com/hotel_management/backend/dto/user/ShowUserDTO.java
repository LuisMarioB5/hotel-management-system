package com.hotel_management.backend.dto.user;

import com.hotel_management.backend.model.UserEntity;

public record ShowUserDTO(
    Long id,

    String username,

    String password,

    Boolean isActive) {
    public ShowUserDTO (UserEntity user){
        this(user.getId(), user.getUsername(), user.getPassword(), user.getIsActive());
    }
}
