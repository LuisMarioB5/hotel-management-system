package com.hotel_management.backend.model;

import com.hotel_management.backend.enums.Roles;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class UserEntity implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

//    private EmployeeEntity employeeEntity; // TODO se debe crear las relaciones hasta llegar a la entidad persona
    @Enumerated(EnumType.STRING)
    private Roles role;

    @Column(nullable = false, unique = true)
    private String username;

    private String password;

    @Column(columnDefinition = "BOOLEAN")
    private Boolean isActive;

    public UserEntity(Roles role, String username, String password, Boolean isActive) {
        this.role = role;
        this.username = username;
        this.password = password;
        this.isActive = isActive;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(this.role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return Boolean.TRUE.equals(this.isActive);
    }
}
