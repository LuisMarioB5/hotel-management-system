package com.hotel_management.backend.user.dto;

import com.hotel_management.backend.user.UserEntity;

public record ShowUserDTO(
    Long id,

    String username,

    String password,

    Boolean isActive) {
    public ShowUserDTO (UserEntity user){
        this(user.getId(), user.getUsername(), user.getPassword(), user.getIsActive());
    }
}
