package com.hotel_management.backend.controller;

import com.hotel_management.backend.dto.person.CreatePersonDTO;
import com.hotel_management.backend.dto.person.ShowPersonDTO;
import com.hotel_management.backend.model.PersonEntity;
import com.hotel_management.backend.service.person.PersonService;
import com.hotel_management.backend.validations.BirthDateValidation;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/person")
public class PersonController {

    private final PersonService service;
    private final BirthDateValidation birthDateValidation = new BirthDateValidation();

    @Autowired
    public PersonController(PersonService service) {
        this.service = service;
    }

    // Endpoint para crear una nueva persona
    @PostMapping
    public ResponseEntity<ShowPersonDTO> createPerson(@RequestBody @Valid CreatePersonDTO personDTO) {
        birthDateValidation.validate(personDTO);
        PersonEntity personEntity = service.save(personDTO);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(personEntity.getId())
                .toUri();
        return ResponseEntity.created(location).body(new ShowPersonDTO(personEntity));
    }

    // Endpoint para mostrar una persona por su ID
    @GetMapping("/{id}")
    public ResponseEntity<ShowPersonDTO> showPerson(@PathVariable Long id) {
        return ResponseEntity.ok(new ShowPersonDTO(service.findById(id)));
    }
}
