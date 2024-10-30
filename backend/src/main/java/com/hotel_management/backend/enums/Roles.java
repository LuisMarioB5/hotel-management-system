package com.hotel_management.backend.enums;

import lombok.Getter;

@Getter
public enum Roles {
    RECEPCIONISTA("recepcionista", "ROLE_RECEPCIONISTA", 1),
    ADMINISTRADOR("administrador", "ROLE_ADMINISTRADOR", 3),
    MANTENIMIENTO("mantenimiento", "ROLE_MANTENIMIENTO", 1),
    VISITANTE("visitante", "ROLE_VISITANTE", 0);

    private final String displayName;
    private final String roleName;
    private final int accessLevel;

    Roles(String displayName, String roleName, int accessLevel) {
        this.displayName = displayName;
        this.roleName = roleName;
        this.accessLevel = accessLevel;
    }
}
