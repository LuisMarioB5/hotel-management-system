package com.hotel_management.backend.enums.room;

public enum RoomStates {
    DISPONIBLE("Disponible"),
    OCUPADA("Ocupada"),
    MANTENIMIENTO("Mantenimiento"),
    LIMPIEZA("Limpieza");

    private final String displayName;

    RoomStates(String displayName) {
        this.displayName = displayName;
    }
}

