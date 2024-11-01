package com.hotel_management.backend.model;

import com.hotel_management.backend.dto.person.CreatePersonDTO;
import com.hotel_management.backend.enums.Genders;
import com.hotel_management.backend.enums.TypeDocuments;
import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Optional;

@Entity
@Table(name = "personas",
        uniqueConstraints = {
         @UniqueConstraint(columnNames = { "tipo_documento", "numero_documento" })
        })
@Getter
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class PersonEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "nombre", nullable = false)
    private String name;

    @Column(name = "apellido", nullable = false)
    private String lastName;

    @Column(name = "genero", nullable = false)
    private Genders gender;

    @Column(name = "telefono", nullable = false, unique = true)
    private String phoneNumber;

    @Column(name = "direccion", nullable = false)
    private String address;

    @Column(name = "f_nacimiento", nullable = false)
    private LocalDate birthDate;

    @Column(name = "tipo_documento", nullable = false)
    private TypeDocuments typeDocument;

    @Column(name = "numero_documento", nullable = false)
    private String documentNumber;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "esta_activo")
    private Boolean isActive;

    public PersonEntity(CreatePersonDTO dto) {
        this.name = dto.name();
        this.lastName = dto.lastName();
        this.gender = Genders.valueOf(dto.gender().toUpperCase());
        this.phoneNumber = dto.phoneNumber();
        this.address = dto.address();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
        try {
            this.birthDate = LocalDate.parse(dto.birthDate(), formatter);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Formato de fecha de nacimiento no válido. Debe ser dd-MM-yyyy.");
        }

        this.typeDocument = TypeDocuments.valueOf(dto.typeDocument().toUpperCase());
        this.documentNumber = dto.documentNumber();
        this.email = dto.email();
        this.isActive = Optional.ofNullable(dto.isActive()).orElse(true);
    }
}
