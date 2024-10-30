package com.hotel_management.backend.dto.person;

import com.hotel_management.backend.model.PersonEntity;

import java.time.LocalDate;

public record ShowPersonDTO(
        Long id,

        String name,

        String lastName,

        String phoneNumber,

        String address,

        LocalDate birthDate,

        String idCard,

        String email,

        Boolean isActive) {
    public ShowPersonDTO(PersonEntity person){
        this(person.getId(),
             person.getName(),
             person.getLastName(),
             person.getPhoneNumber(),
             person.getAddress(),
             person.getBirthDate(),
             person.getIdCard(),
             person.getEmail(),
             person.getIsActive()
        );
    }
}
