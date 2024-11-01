package com.hotel_management.backend.enums;

import lombok.Getter;

@Getter
public enum TypeDocuments {
    CEDULA("Cédula"),
    PASAPORTE("Pasaporte");

    private final String displayName;

    TypeDocuments(String displayName) {
        this.displayName = displayName;
    }
}
