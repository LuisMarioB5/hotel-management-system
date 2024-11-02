package com.hotel_management.backend.service;

import com.hotel_management.backend.dto.person.CreatePersonDTO;
import com.hotel_management.backend.model.PersonEntity;
import com.hotel_management.backend.repository.PersonRepository;
import com.hotel_management.backend.validations.person.CreatePersonValidation;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PersonService {

    private final PersonRepository repository;
    private final CreatePersonValidation createPerson;
    private static final Logger logger = LoggerFactory.getLogger(PersonService.class);

    @Autowired
    public PersonService(PersonRepository repository, CreatePersonValidation createPerson) {
        this.repository = repository;
        this.createPerson = createPerson;
    }

    // Guarda un nuevo usuario
    @Transactional
    public PersonEntity save(@Valid CreatePersonDTO personDTO) {
        createPerson.validate(personDTO);
        PersonEntity person = new PersonEntity(personDTO);

        return repository.save(person);
    }

    // Busca a todas las personas
    public List<PersonEntity> findAll() {
        return repository.findAll();
    }

    // Busca a una persona por ID
    public PersonEntity findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("No se encontró a la persona con id: {}", id);
                    return new EntityNotFoundException("No se encontró a la persona con id " + id);
                });
    }
}
