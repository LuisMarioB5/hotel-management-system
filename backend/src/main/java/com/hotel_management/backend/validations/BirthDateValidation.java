package com.hotel_management.backend.validations;

import com.hotel_management.backend.dto.person.CreatePersonDTO;
import com.hotel_management.backend.exceptions.specific.ValidationException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Component
public class BirthDateValidation implements ValidatorBirthDate {
    @Override
    public void validate(CreatePersonDTO dto) {
        LocalDate now = LocalDate.now();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
        try {
            LocalDate localDate = LocalDate.parse(dto.birthDate(), formatter);
            if (localDate.isAfter(now)) {
                throw new ValidationException("La fecha de nacimiento debe estar en el pasado");
            }
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Formato de fecha de nacimiento no válido. Debe ser dd-MM-yyyy.");
        } catch (ValidationException e) {
            throw new RuntimeException(e);
        }
    }
}
