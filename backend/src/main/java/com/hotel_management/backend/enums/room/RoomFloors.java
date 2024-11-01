package com.hotel_management.backend.enums.room;

public enum RoomFloors {
    PRIMERO("Primero"),
    SEGUNDO("Segundo"),
    TERCERO("Tercero"),
    CUARTO("Cuarto"),
    QUINTO("Quinto");

    private final String displayName;

    RoomFloors(String displayName) {
        this.displayName = displayName;
    }
}
