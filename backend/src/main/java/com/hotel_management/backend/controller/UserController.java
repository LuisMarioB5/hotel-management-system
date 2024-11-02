package com.hotel_management.backend.controller;

import com.hotel_management.backend.model.UserEntity;
import com.hotel_management.backend.service.UserService;
import com.hotel_management.backend.dto.user.ShowUserDTO;
import com.hotel_management.backend.dto.user.CreateUserDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/user")
public class UserController {

    private final UserService service;

    @Autowired
    public UserController(UserService service) {
        this.service = service;
    }

    // Endpoint para crear un nuevo usuario
    @PostMapping
    public ResponseEntity<ShowUserDTO> createUser(@RequestBody @Valid CreateUserDTO userDTO) {
        UserEntity userEntity = service.save(userDTO);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(userEntity.getId())
                .toUri();
        return ResponseEntity.created(location).body(new ShowUserDTO(userEntity));
    }

    // Endpoint para mostrar todos los usuarios
    @GetMapping
    public ResponseEntity<List<ShowUserDTO>> showAllUsers() {
        List<UserEntity> users = service.findAll();
        if (users == null || users.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        List<ShowUserDTO> showUserDTOS = users.stream()
                .map(ShowUserDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(showUserDTOS);
    }

    // Endpoint para mostrar un usuario por su ID
    @GetMapping("/{id}")
    public ResponseEntity<ShowUserDTO> showUser(@PathVariable Long id) {
        return ResponseEntity.ok(new ShowUserDTO(service.findById(id)));
    }
}
