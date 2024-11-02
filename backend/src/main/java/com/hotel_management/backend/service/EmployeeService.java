package com.hotel_management.backend.service;

import com.hotel_management.backend.dto.employee.CreateEmployeeDTO;

import com.hotel_management.backend.model.EmployeeEntity;
import com.hotel_management.backend.model.PersonEntity;
import com.hotel_management.backend.repository.EmployeeRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService {

    private final EmployeeRepository repository;
    private final PersonService personService;
    private static final Logger logger = LoggerFactory.getLogger(EmployeeService.class);

    @Autowired
    public EmployeeService(EmployeeRepository repository, PersonService personService) {
        this.repository = repository;
        this.personService = personService;
    }

    // Guarda un nuevo usuario
    @Transactional
    public EmployeeEntity save(@Valid CreateEmployeeDTO employeeDTO) {
        PersonEntity person = personService.findById(employeeDTO.idPerson());

        Boolean isActive = Optional.ofNullable(employeeDTO.isActive())
                .orElse(true);

        EmployeeEntity employee = new EmployeeEntity(person, employeeDTO.salary(), isActive);

        return repository.save(employee);
    }

    // Busca a todos los empleados
    public List<EmployeeEntity> findAll() {
        return repository.findAll();
    }

    // Busca un empleado por ID
    public EmployeeEntity findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("No se encontró el empleado con id: {}", id);
                    return new EntityNotFoundException("No se encontró el empleado con id " + id);
                });
    }
}
