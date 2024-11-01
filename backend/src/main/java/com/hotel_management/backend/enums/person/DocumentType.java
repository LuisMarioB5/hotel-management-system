package com.hotel_management.backend.enums.person;

import lombok.Getter;

@Getter
public enum DocumentType {
    CEDULA("Cédula"),
    PASAPORTE("Pasaporte");

    private final String displayName;

    DocumentType(String displayName) {
        this.displayName = displayName;
    }
}
