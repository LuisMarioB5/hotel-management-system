package com.hotel_management.backend.validations.person;

import com.hotel_management.backend.dto.person.CreatePersonDTO;

public interface CreatePersonValidator {
    void validate(CreatePersonDTO dto);
}
