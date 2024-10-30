package com.hotel_management.backend.service.person;

import com.hotel_management.backend.dto.person.CreatePersonDTO;
import com.hotel_management.backend.model.PersonEntity;
import com.hotel_management.backend.repository.PersonRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PersonService {

    private final PersonRepository repository;
    private static final Logger logger = LoggerFactory.getLogger(PersonService.class);

    @Autowired
    public PersonService(PersonRepository repository) {
        this.repository = repository;
    }

    // Guarda un nuevo usuario
    @Transactional
    public PersonEntity save(@Valid CreatePersonDTO personDTO) {
        PersonEntity person = new PersonEntity(personDTO);

        return repository.save(person);
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
