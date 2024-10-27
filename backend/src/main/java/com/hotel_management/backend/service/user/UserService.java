package com.hotel_management.backend.service.user;

import com.hotel_management.backend.enums.Roles;
import com.hotel_management.backend.model.UserEntity;
import com.hotel_management.backend.repository.UserRepository;
import com.hotel_management.backend.dto.user.AddUserDTO;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    public UserService(UserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    // Guarda un nuevo usuario
    @Transactional
    public UserEntity save(@Valid AddUserDTO userDTO) {
        Roles role = Optional.ofNullable(userDTO.role())
                .map(r -> Roles.valueOf(r.toUpperCase()))
                .orElse(Roles.VISITANTE);

        String encodedPassword = passwordEncoder.encode(userDTO.password());

        Boolean isActive = Optional.ofNullable(userDTO.isActive())
                .orElse(true);

        UserEntity user = new UserEntity(role, userDTO.username(), encodedPassword, isActive);

        return repository.save(user);
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
