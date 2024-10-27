    package com.hotel_management.backend.security.service;

    import com.auth0.jwt.JWT;
    import com.auth0.jwt.algorithms.Algorithm;
    import com.auth0.jwt.exceptions.JWTCreationException;
    import com.auth0.jwt.exceptions.JWTVerificationException;
    import com.auth0.jwt.interfaces.DecodedJWT;
    import com.hotel_management.backend.errors.ResourceNotFoundException;
    import com.hotel_management.backend.errors.ValidationException;
    import com.hotel_management.backend.user.UserEntity;
    import com.hotel_management.backend.user.Roles;
    import org.slf4j.Logger;
    import org.slf4j.LoggerFactory;
    import org.springframework.security.core.GrantedAuthority;
    import org.springframework.stereotype.Service;

    import java.time.Instant;
    import java.time.LocalDateTime;
    import java.time.ZoneOffset;

    @Service
    public class TokenService {
        private final String JWT_SECRET = getSecret();
        private final Algorithm algorithm = Algorithm.HMAC256(JWT_SECRET);

        private static final Logger logger = LoggerFactory.getLogger(TokenService.class);

        private String getSecret() {
            String secret = System.getenv("JWT_SECRET");
            if (secret == null || secret.isBlank()) {
                logger.error("La variable de entorno 'JWT_SECRET' esta faltando o esta vacía");
                throw new ResourceNotFoundException("La variable de entorno 'JWT_SECRET' es obligatoria.");
            }

            return secret;
        }

        public String generateToken(UserEntity user, String username) {
            try {
                logger.info("Generando JWT para el usuario: {}", username);
                return JWT.create()
                        .withIssuer("Sistema de Gestión Hotelera - Backend")
                        .withSubject(username)
                        .withClaim("id", user.getId())
                        .withClaim("role", user.getAuthorities().stream().findFirst().map(GrantedAuthority::getAuthority).orElse(Roles.VISITANTE.toString()))
                        .withClaim("isActive", user.getIsActive())
                        .withExpiresAt(generateExpirationDate())
                        .sign(algorithm);
            } catch (JWTCreationException exception) {
                logger.error("Error mientras se creaba el JWT: {}", exception.getMessage());
                throw new ValidationException(exception.getMessage());
            }
        }

        private Instant generateExpirationDate() {
            return LocalDateTime.now().plusHours(4).toInstant(ZoneOffset.of("-04:00"));
        }

        public DecodedJWT getAllClaims(String token) {
            if (token == null || token.isBlank()) {
                logger.warn("El token es nulo o esta vacío");
                throw new ValidationException("El token no puede ser nulo o vacío");
            }

            try {
                logger.info("Validando el token");
                return JWT.require(algorithm)
                        .withIssuer("Sistema de Gestión Hotelera - Backend")
                        .build()
                        .verify(token);
            } catch (JWTVerificationException exception) {
                logger.error("La verificación del token fallo: {}", exception.getMessage());
                throw new ValidationException(exception.getMessage());
            }
        }

        public String getSubject(String token) {
            return getAllClaims(token).getSubject();
        }
    }
