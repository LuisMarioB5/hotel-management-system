package com.hotel_management.backend.security.filters;

import com.hotel_management.backend.exceptions.specific.ValidationException;
import com.hotel_management.backend.config.PermittedRoutesConfig;
import com.hotel_management.backend.model.UserEntity;
import com.hotel_management.backend.repository.UserRepository;
import com.hotel_management.backend.service.auth.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class SecurityFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final UserRepository userRepository;
    private final PermittedRoutesConfig permittedRoutesConfig;
    private static final Logger logger = LoggerFactory.getLogger(SecurityFilter.class);

    @Autowired
    public SecurityFilter(TokenService tokenService, UserRepository userRepository, PermittedRoutesConfig permittedRoutesConfig) {
        this.tokenService = tokenService;
        this.userRepository = userRepository;
        this.permittedRoutesConfig = permittedRoutesConfig;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String requestAuthHeader = request.getHeader("Authorization");
        String requestPath = request.getRequestURI();
        String requestMethod = request.getMethod();

        // Verifica si la ruta no necesita autenticación
        if (permittedRoutesConfig.isPermitted(requestPath, requestMethod)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Verifica el encabezado de autenticación para las rutas protegidas
        if (requestAuthHeader == null || !requestAuthHeader.startsWith("Bearer ")) {
            logger.warn("Falta el header de autorización o esta mal formado");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String token = requestAuthHeader.replace("Bearer ", "");
        String subject;

        try {
            subject = tokenService.getSubject(token);
        } catch (ValidationException e) {
            logger.warn("Token inválido: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        if (subject == null) {
            logger.warn("El 'subject' del token es nulo: {}", token);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        Optional<UserEntity> userEntity = userRepository.findByUsername(subject);
        if (userEntity.isEmpty()) {
            logger.warn("Usuario no encontrado: {}", subject);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        var authUser = new UsernamePasswordAuthenticationToken(userEntity.get(), null, userEntity.get().getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authUser);
        logger.info("Usuario autenticado: {}", subject);

        filterChain.doFilter(request, response);
    }
}
