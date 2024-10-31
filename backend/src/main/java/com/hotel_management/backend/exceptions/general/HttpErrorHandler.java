package com.hotel_management.backend.exceptions.general;

import com.hotel_management.backend.exceptions.specific.EntityNotActiveException;
import com.hotel_management.backend.exceptions.specific.ResourceNotFoundException;
import com.hotel_management.backend.exceptions.specific.ValidationException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import java.sql.SQLIntegrityConstraintViolationException;

@RestControllerAdvice
public class HttpErrorHandler {

    // Manejo de excepciones más generales
    @ExceptionHandler(SQLIntegrityConstraintViolationException.class)
    public ResponseEntity<ApiError> handleSQLIntegrityConstraintViolationExceptiond(SQLIntegrityConstraintViolationException e, WebRequest request) {
        ApiError error = new ApiError(HttpStatus.CONFLICT, e.getMessage(), request.getDescription(false));
        return ResponseEntity.status(error.getStatus()).body(error);
    }
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiError> handleEntityNotFoundException(EntityNotFoundException e, WebRequest request) {
        ApiError error = new ApiError(HttpStatus.NOT_FOUND, e.getMessage(), request.getDescription(false));
        return ResponseEntity.status(error.getStatus()).body(error);
    }

    @ExceptionHandler(EntityNotActiveException.class)
    public ResponseEntity<ApiError> handleEntityNotActiveException(EntityNotActiveException e, WebRequest request) {
        ApiError error = new ApiError(HttpStatus.NOT_FOUND, e.getMessage(), request.getDescription(false));
        return ResponseEntity.status(error.getStatus()).body(error);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiError> handleValidationException(ValidationException e, WebRequest request) {
        ApiError error = new ApiError(HttpStatus.BAD_REQUEST, e.getMessage(), request.getDescription(false));
        return ResponseEntity.status(error.getStatus()).body(error);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFound(ResourceNotFoundException e, WebRequest request) {
        ApiError error = new ApiError(HttpStatus.NOT_FOUND, e.getMessage(), request.getDescription(false));
        return ResponseEntity.status(error.getStatus()).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        var errors = e.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> new ValidationErrorData(fieldError.getField(), fieldError.getDefaultMessage()))
                .toList();

        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<?> handleHandlerMethodValidationException(HandlerMethodValidationException e) {
        var errors = e.getAllErrors().stream()
                .map(error -> {
                    if (error instanceof FieldError fieldError) {
                        return new ValidationErrorData(fieldError.getField(), fieldError.getDefaultMessage());
                    }
                    return new ValidationErrorData("unknown", error.getDefaultMessage());
                })
                .toList();

        return ResponseEntity.badRequest().body(errors);
    }

    // Clase interna para manejar los detalles de los errores de validación
    private record ValidationErrorData(String field, String errorMessage) {}
}
