package com.hotel_management.backend.errors;

public class EntityNotActiveException extends RuntimeException {
    public EntityNotActiveException(String message) {
        super(message);
    }
}
