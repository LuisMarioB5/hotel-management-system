package com.hotel_management.backend.controller;

import com.hotel_management.backend.dto.auth.AuthDTO;
import com.hotel_management.backend.model.UserEntity;
import com.hotel_management.backend.service.auth.TokenService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/login")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    public AuthController(AuthenticationManager authenticationManager, TokenService tokenService) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
    }

    // Endpoint para autentificar a un usuario
    @PostMapping
    public ResponseEntity<?> authUser(@RequestBody @Valid AuthDTO user) {
        try {
            logger.info("Intentando autentificar al usuario: {}", user.username());
            Authentication token = new UsernamePasswordAuthenticationToken(user.username(), user.password());
            Authentication authUser = authenticationManager.authenticate(token);

            logger.info("Usuario autentificado: {}", user.username());

            var JWTToken = tokenService.generateToken((UserEntity) authUser.getPrincipal(), user.username());

            logger.info("Token generado Satisfactoriamente");

            return ResponseEntity.ok()
                    .header("Authorization", "Bearer " + JWTToken)
                    .build();
        } catch (AuthenticationException e) {
            logger.warn("Autenticación fallida para el usuario: {}", user.username());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
