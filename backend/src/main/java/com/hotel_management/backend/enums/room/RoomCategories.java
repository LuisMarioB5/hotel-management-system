package com.hotel_management.backend.enums.room;

public enum RoomCategories {
    INDIVIDUAL("Individual"),
    DOBLE("Doble"),
    MATRIMONIAL("Matrimonial");

    private final String displayName;

    RoomCategories(String displayName) {
        this.displayName = displayName;
    }
}
