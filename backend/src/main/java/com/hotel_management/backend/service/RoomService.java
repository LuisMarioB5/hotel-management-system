package com.hotel_management.backend.service;

import com.hotel_management.backend.dto.room.CreateRoomDTO;
import com.hotel_management.backend.model.RoomEntity;
import com.hotel_management.backend.repository.RoomRepository;
import com.hotel_management.backend.validations.room.CreateRoomValidation;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomService {

    private final RoomRepository repository;
    private final CreateRoomValidation createRoom;
    private static final Logger logger = LoggerFactory.getLogger(RoomService.class);

    @Autowired
    public RoomService(RoomRepository repository, CreateRoomValidation createRoom) {
        this.repository = repository;
        this.createRoom = createRoom;
    }

    // Guarda un nuevo usuario
    @Transactional
    public RoomEntity save(@Valid CreateRoomDTO roomDTO) {
        createRoom.validate(roomDTO);
        RoomEntity room = new RoomEntity(roomDTO);

        return repository.save(room);
    }

    // Busca a todas las habitaciones
    public List<RoomEntity> findAll() {
        return repository.findAll();
    }

    // Busca a una persona por ID
    public RoomEntity findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("No se encontró la habitación con id: {}", id);
                    return new EntityNotFoundException("No se encontró la habitación con id: " + id);
                });
    }
}
