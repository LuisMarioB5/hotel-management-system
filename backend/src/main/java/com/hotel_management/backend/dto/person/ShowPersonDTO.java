package com.hotel_management.backend.dto.person;

import com.hotel_management.backend.model.PersonEntity;

import java.time.LocalDate;

public record ShowPersonDTO(
        Long id,

        String name,

        String lastName,

        String gender,

        String phoneNumber,

        String address,

        LocalDate birthDate,

        String documentNumber,

        String idCard,

        String email,

        Boolean isActive) {
    public ShowPersonDTO(PersonEntity person){
        this(person.getId(),
             person.getName(),
             person.getLastName(),
             person.getGender().getDisplayName(),
             person.getPhoneNumber(),
             person.getAddress(),
             person.getBirthDate(),
             person.getTypeDocument().getDisplayName(),
             person.getDocumentNumber(),
             person.getEmail(),
             person.getIsActive()
        );
    }
}
