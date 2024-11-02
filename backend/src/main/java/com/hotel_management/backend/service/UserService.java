package com.hotel_management.backend.service;

import com.hotel_management.backend.enums.user.Roles;
import com.hotel_management.backend.model.EmployeeEntity;
import com.hotel_management.backend.model.UserEntity;
import com.hotel_management.backend.repository.UserRepository;
import com.hotel_management.backend.dto.user.CreateUserDTO;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository repository;
    private final EmployeeService employeeService;
    private final PasswordEncoder passwordEncoder;
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    public UserService(UserRepository repository, EmployeeService employeeService, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.employeeService = employeeService;
        this.passwordEncoder = passwordEncoder;
    }

    // Guarda un nuevo usuario
    @Transactional
    public UserEntity save(@Valid CreateUserDTO userDTO) {
        EmployeeEntity employee = employeeService.findById(userDTO.idEmployee());

        Roles role = Optional.ofNullable(userDTO.role())
                .map(r -> Roles.valueOf(r.toUpperCase()))
                .orElse(Roles.VISITANTE);

        String encodedPassword = passwordEncoder.encode(userDTO.password());

        Boolean isActive = Optional.ofNullable(userDTO.isActive())
                .orElse(true);

        UserEntity user = new UserEntity(employee, role, userDTO.username(), encodedPassword, isActive);

        return repository.save(user);
    }

    // Busca a todos los usuarios
    public List<UserEntity> findAll() {
        return repository.findAll();
    }

    // Busca un usuario por ID
    public UserEntity findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("No se encontró el usuario con id: {}", id);
                    return new EntityNotFoundException("No se encontró el usuario con id " + id);
                });
    }
}
