package com.hotel_management.backend.enums;

import lombok.Getter;

@Getter
public enum Genders {
    MASCULINO("Masculino"),
    FEMENINO("Femenino");

    private final String displayName;

    Genders(String displayName) {
        this.displayName = displayName;
    }
}
