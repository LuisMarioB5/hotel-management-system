package com.hotel_management.backend.validations;

import com.hotel_management.backend.dto.person.CreatePersonDTO;
import com.hotel_management.backend.enums.Genders;
import com.hotel_management.backend.enums.TypeDocuments;
import com.hotel_management.backend.exceptions.specific.ValidationException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class CreatePersonValidation implements CreatePersonValidator {
    private CreatePersonDTO dto;

    @Override
    public void validate(CreatePersonDTO personDTO) {
        this.dto = personDTO;
        genderValidation();
        birthDateValidation();
        typeDocumentValidation();
        documentNumberValidation();
    }

    private void genderValidation() {
        try {
            Genders.valueOf(this.dto.gender().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("El género ingresado no es válido");
        }
    }

    private void birthDateValidation() {
        LocalDate now = LocalDate.now();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
        try {
            LocalDate localDate = LocalDate.parse(this.dto.birthDate(), formatter);
            if (localDate.isAfter(now)) {
                throw new ValidationException("La fecha de nacimiento debe estar en el pasado");
            }
        } catch (DateTimeParseException e) {
            throw new ValidationException("Formato de fecha de nacimiento no válido. Debe ser dd-MM-yyyy.");
        }
    }

    private void typeDocumentValidation() {
        try {
            TypeDocuments.valueOf(this.dto.typeDocument().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("El tipo de documento ingresado no es válido");
        }
    }

    private void documentNumberValidation() {
        TypeDocuments typeDocument = TypeDocuments.valueOf(dto.typeDocument().toUpperCase());

        if (typeDocument == TypeDocuments.CEDULA) {
            Pattern pattern = Pattern.compile("^\\d{3}-?\\d{7}-?\\d$");
            Matcher matcher = pattern.matcher(this.dto.documentNumber());
            if (!matcher.matches()) {
                throw new ValidationException("Formato de cédula no válido. Debe ser XXX-XXXXXXX-X, XXXXXXXXX-X o XXXXXXXXXXX");
            }
        } else if (typeDocument == TypeDocuments.PASAPORTE) {
            Pattern pattern = Pattern.compile("^[A-Z0-9]{6,11}$");
            Matcher matcher = pattern.matcher(this.dto.documentNumber());
            if (!matcher.matches()) {
                throw new ValidationException("Formato de pasaporte no válido. Debe contener entre 6 y 11 caracteres alfanuméricos.");
            }
        }
    }
}
