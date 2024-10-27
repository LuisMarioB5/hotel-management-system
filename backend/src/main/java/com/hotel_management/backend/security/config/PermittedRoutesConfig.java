package com.hotel_management.backend.security.config;

import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Component
@Getter
public class PermittedRoutesConfig {
    private final Map<String, Set<String>> permittedRoutes = new HashMap<String, Set<String>>();

    public PermittedRoutesConfig() {
        this.permittedRoutes.put("/login", Set.of("POST"));
        this.permittedRoutes.put("/user", Set.of("POST"));
    }

    public boolean isPermitted(String path, String method) {
        Set<String> methods = this.permittedRoutes.get(path);
        return methods != null && methods.contains(method);
    }
}
