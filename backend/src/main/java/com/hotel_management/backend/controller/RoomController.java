package com.hotel_management.backend.controller;

import com.hotel_management.backend.dto.room.CreateRoomDTO;
import com.hotel_management.backend.dto.room.ShowRoomDTO;
import com.hotel_management.backend.model.RoomEntity;
import com.hotel_management.backend.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/room")
public class RoomController {

    private final RoomService service;

    @Autowired
    public RoomController(RoomService service) {
        this.service = service;
    }

    // Endpoint para crear una nueva habitación
    @PostMapping
    public ResponseEntity<ShowRoomDTO> createRoom(@RequestBody @Valid CreateRoomDTO roomDTO) {
        RoomEntity roomEntity = service.save(roomDTO);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(roomEntity.getId())
                .toUri();
        return ResponseEntity.created(location).body(new ShowRoomDTO(roomEntity));
    }

    // Endpoint para mostrar todas las habitaciones
    @GetMapping
    public ResponseEntity<List<ShowRoomDTO>> showAllRooms() {
        List<RoomEntity> rooms = service.findAll();
        if (rooms == null || rooms.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        List<ShowRoomDTO> showRoomDTOS = rooms.stream()
                .map(ShowRoomDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(showRoomDTOS);
    }

    // Endpoint para mostrar una habitación por su ID
    @GetMapping("/{id}")
    public ResponseEntity<ShowRoomDTO> showRoom(@PathVariable Long id) {
        return ResponseEntity.ok(new ShowRoomDTO(service.findById(id)));
    }
}
