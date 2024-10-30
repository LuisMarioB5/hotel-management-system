package com.hotel_management.backend.model;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "empleados")
@Getter
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class EmployeeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @OneToOne
    @JoinColumn(name = "id_persona", nullable = false, unique = true)
    private PersonEntity personEntity;

    @Column(name = "sueldo", nullable = false)
    private Double salary;

    @Column(name = "esta_activo")
    private Boolean isActive;

    public EmployeeEntity(PersonEntity personEntity, Double salary, Boolean isActive) {
        this.personEntity = personEntity;
        this.salary = salary;
        this.isActive = isActive;
    }
}
