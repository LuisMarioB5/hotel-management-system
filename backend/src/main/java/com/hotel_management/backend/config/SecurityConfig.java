package com.hotel_management.backend.config;

import com.hotel_management.backend.security.filters.SecurityFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Map;
import java.util.Set;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final SecurityFilter securityFilter;
    private final PermittedRoutesConfig permittedRoutesConfig;
    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    @Autowired
    public SecurityConfig(SecurityFilter securityFilter, PermittedRoutesConfig permittedRoutesConfig) {
        this.securityFilter = securityFilter;
        this.permittedRoutesConfig = permittedRoutesConfig;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        logger.info("Inicializando la configuración de la cadena de filtros de seguridad");

        logger.info("Agregando rutas sin autenticación");
        for (Map.Entry<String, Set<String>> permittedRoute :
                permittedRoutesConfig.getPermittedRoutes().entrySet()) {
            for (String method : permittedRoute.getValue()) {
                http.authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.valueOf(method.toUpperCase()), permittedRoute.getKey()).permitAll());
            }
        }
        logger.info("Finalizó el agregado de rutas sin autenticación");

        return http
                .csrf(AbstractHttpConfigurer::disable)  // Deshabilitamos CSRF porque estamos usando tokens JWT
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))  // Stateless para trabajar con JWT
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyRequest().authenticated())  // Cualquier otra solicitud requiere autenticación
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)  // Añadir nuestro filtro personalizado antes de UsernamePasswordAuthenticationFilter
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        logger.info("Inicializando el 'AuthenticationManager'");
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        logger.info("Configurando 'BCryptPasswordEncoder' como encoder de contraseñas");
        return new BCryptPasswordEncoder();
    }
}
