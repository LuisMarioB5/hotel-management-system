package com.hotel_management.backend.exceptions.specific;

public class EntityNotActiveException extends RuntimeException {
    public EntityNotActiveException(String message) {
        super(message);
    }
}
