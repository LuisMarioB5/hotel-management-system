package com.hotel_management.backend.model;

import com.hotel_management.backend.dto.room.CreateRoomDTO;
import com.hotel_management.backend.enums.room.RoomCategories;
import com.hotel_management.backend.enums.room.RoomFloors;
import com.hotel_management.backend.enums.room.RoomStates;
import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Optional;

@Entity
@Table(name = "habitaciones")
@Getter
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class RoomEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "numero_habitacion", nullable = false)
    private Long roomNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "categoria", nullable = false)
    private RoomCategories category;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private RoomStates state;

    @Column(name = "precio_noche", nullable = false)
    private Double pricePerNight;

    @Enumerated(EnumType.STRING)
    @Column(name = "piso", nullable = false)
    private RoomFloors floor;

    @Column(name = "detalle")
    private String details;

    @Column(name = "esta_activa")
    private Boolean isActive;

    public RoomEntity(CreateRoomDTO dto) {
        this.roomNumber = dto.roomNumber();
        this.category = RoomCategories.valueOf(dto.category().toUpperCase());
        this.state = RoomStates.valueOf(dto.state().toUpperCase());
        this.pricePerNight = dto.pricePerNight();
        this.floor = RoomFloors.valueOf(dto.floor().toUpperCase());
        this.details = dto.details();
        this.isActive = Optional.ofNullable(dto.isActive())
                .orElse(true);
    }
}
