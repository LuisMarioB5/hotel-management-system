package com.hotel_management.backend.validations.room;

import com.hotel_management.backend.dto.room.CreateRoomDTO;
import com.hotel_management.backend.enums.room.RoomCategories;
import com.hotel_management.backend.enums.room.RoomFloors;
import com.hotel_management.backend.enums.room.RoomStates;
import com.hotel_management.backend.exceptions.specific.ValidationException;
import org.springframework.stereotype.Component;

@Component
public class CreateRoomValidation implements CreateRoomValidator {
    private CreateRoomDTO dto;

    @Override
    public void validate(CreateRoomDTO roomDTO) {
        this.dto = roomDTO;
        categoryValidation();
        stateValidation();
        floorValidation();
    }

    private void categoryValidation() {
        try {
            RoomCategories.valueOf(this.dto.category().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("La categoria de la habitación ingresada no es válida");
        }
    }

    private void stateValidation() {
        try {
            RoomStates.valueOf(this.dto.state().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("El estado de la habitación ingresado no es válido");
        }
    }

    private void floorValidation() {
        try {
            RoomFloors.valueOf(this.dto.floor().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("El piso de la habitación ingresado no es válido");
        }
    }
}
