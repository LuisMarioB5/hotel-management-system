package com.hotel_management.backend.enums.user;

import lombok.Getter;

@Getter
public enum Roles {
    RECEPCIONISTA("Recepcionista"),
    ADMINISTRADOR("Administrador"),
    MANTENIMIENTO("Mantenimiento"),
    VISITANTE("Visitante");

    private final String displayName;

    Roles(String displayName) {
        this.displayName = displayName;
    }
}
