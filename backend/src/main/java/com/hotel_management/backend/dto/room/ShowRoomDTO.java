package com.hotel_management.backend.dto.room;

import com.hotel_management.backend.enums.room.RoomCategories;
import com.hotel_management.backend.enums.room.RoomFloors;
import com.hotel_management.backend.enums.room.RoomStates;
import com.hotel_management.backend.model.RoomEntity;

public record ShowRoomDTO(
        Long id,

        Long roomNumber,

        RoomCategories category,

        RoomStates state,

        Double pricePerNight,

        RoomFloors floor,

        String details,

        Boolean isActive
) {
    public ShowRoomDTO(RoomEntity entity) {
        this(
                entity.getId(),
                entity.getRoomNumber(),
                entity.getCategory(),
                entity.getState(),
                entity.getPricePerNight(),
                entity.getFloor(),
                entity.getDetails(),
                entity.getIsActive()
        );
    }
}
