package com.hotel_management.backend.user;

import com.hotel_management.backend.user.dto.ShowUserDTO;
import com.hotel_management.backend.user.dto.AddUserDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

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
    public ResponseEntity<ShowUserDTO> addUser(@RequestBody @Valid AddUserDTO user) {
        UserEntity userEntity = service.save(user);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(userEntity.getId())
                .toUri();
        return ResponseEntity.created(location).body(new ShowUserDTO(userEntity));
    }

    // Endpoint para mostrar un usuario por su ID
    @GetMapping("/{id}")
    public ResponseEntity<ShowUserDTO> showUser(@PathVariable Long id) {
        return ResponseEntity.ok(new ShowUserDTO(service.findById(id)));
    }
}
