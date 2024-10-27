package com.hotel_management.backend.exceptions.specific;

public class ValidationException extends RuntimeException {
    public ValidationException(String message) {
        super(message);
    }
}
