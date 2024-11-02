package com.hotel_management.backend.controller;

import com.hotel_management.backend.dto.employee.CreateEmployeeDTO;
import com.hotel_management.backend.dto.employee.ShowEmployeeDTO;
import com.hotel_management.backend.model.EmployeeEntity;
import com.hotel_management.backend.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/employee")
public class EmployeeController {

    private final EmployeeService service;

    @Autowired
    public EmployeeController(EmployeeService service) {
        this.service = service;
    }

    // Endpoint para crear un nuevo empleado
    @PostMapping
    public ResponseEntity<ShowEmployeeDTO> createEmployee(@RequestBody @Valid CreateEmployeeDTO employeeDTO) {
        EmployeeEntity employeeEntity = service.save(employeeDTO);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(employeeEntity.getId())
                .toUri();
        return ResponseEntity.created(location).body(new ShowEmployeeDTO(employeeEntity));
    }

    // Endpoint para mostrar todos los empleados
    @GetMapping
    public ResponseEntity<List<ShowEmployeeDTO>> showAllEmployees() {
        List<EmployeeEntity> employees = service.findAll();
        if (employees == null || employees.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        List<ShowEmployeeDTO> employeeDTOList = employees.stream()
                .map(ShowEmployeeDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(employeeDTOList);
    }

    // Endpoint para mostrar un empleado por su ID
    @GetMapping("/{id}")
    public ResponseEntity<ShowEmployeeDTO> showEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(new ShowEmployeeDTO(service.findById(id)));
    }
}
