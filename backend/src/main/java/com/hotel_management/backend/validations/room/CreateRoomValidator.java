package com.hotel_management.backend.validations.room;

import com.hotel_management.backend.dto.room.CreateRoomDTO;

public interface CreateRoomValidator {
    void validate(CreateRoomDTO dto);
}
