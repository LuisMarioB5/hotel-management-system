package com.hotel_management.backend.model;

import com.hotel_management.backend.enums.room.RoomCategories;
import com.hotel_management.backend.enums.room.RoomFloors;
import com.hotel_management.backend.enums.room.RoomStates;
import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

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

    @Column(name = "esta_activa")
    private Boolean isActive;
}
