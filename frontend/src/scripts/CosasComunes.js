import { validateJwt } from "../auth/utils.auth.js";
import { validateAccess } from '../auth/guard.auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Validar que el usuario tiene permisos para acceder a la pagina
    validateAccess();

    // Obtener el rol del usuario
    const user = await validateJwt();
    const role = user?.role || null; // Obtener el rol del usuario o null si no está definido

    // Definir permisos por rol (basado en la matriz de acceso)
    const permissions = {
        ADMINISTRADOR: {
            dashboard: true,
            gestion: ['recepcion', 'reservas', 'salida', 'limpieza'],
            tienda: ['vender'],
            mantenimiento: ['usuarios', 'clientes', 'habitacion', 'productos'],
            reportes: true,
        },
        RECEPCIONISTA: {
            dashboard: true,
            gestion: ['recepcion', 'reservas', 'salida'],
            tienda: ['vender'],
            mantenimiento: [],
            reportes: false,
        },
        GERENTE: {
            dashboard: true,
            gestion: [],
            tienda: [],
            mantenimiento: [],
            reportes: true,
        },
        MANTENIMIENTO: {
            dashboard: false,
            gestion: ['limpieza'],
            tienda: [],
            mantenimiento: ['habitacion'],
            reportes: false,
        },
    };

    // Determinar las secciones permitidas para el rol actual
    const allowedSections = permissions[role] || {};

    // Crear el HTML dinámico del sidebar
    const sidebarHTML = `
        <div class="sidebar">
            <h2>HODELPA</h2>
            <br><br>
            <ul>
                ${allowedSections.dashboard ? `<li><a href="../pages/dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>` : ''}
                ${allowedSections.gestion?.length ? `
                <li class="dropdown">
                    <a href="#" class="dropbtn"><i class="fas fa-hotel"></i> Gestion <i class="fas fa-chevron-down"></i></a>
                    <div class="dropdown-content">
                        ${allowedSections.gestion.includes('recepcion') ? `<a href="../pages/G_recepcion.html"><i class="fas fa-concierge-bell"></i> Recepcion</a>` : ''}
                        ${allowedSections.gestion.includes('reservas') ? `<a href="../pages/G_reservaciones.html"><i class="fas fa-calendar-check"></i> Reservas</a>` : ''}
                        ${allowedSections.gestion.includes('salida') ? `<a href="../pages/G_salida.html"><i class="fas fa-door-open"></i> Salida</a>` : ''}
                        ${allowedSections.gestion.includes('limpieza') ? `<a href="../pages/M_limpieza.html"><i class="fas fa-broom"></i> Limpieza</a>` : ''}
                    </div>
                </li>` : ''}
                ${allowedSections.tienda?.length ? `
                <li class="dropdown">
                    <a href="#" class="dropbtn"><i class="fas fa-store"></i> Tienda <i class="fas fa-chevron-down"></i></a>
                    <div class="dropdown-content">
                        ${allowedSections.tienda.includes('vender') ? `<a href="../pages/T_vender.html"><i class="fas fa-shopping-cart"></i> Vender</a>` : ''}
                    </div>
                </li>` : ''}
                ${allowedSections.mantenimiento?.length ? `
                <li class="dropdown">
                    <a href="#" class="dropbtn"><i class="fas fa-tools"></i> Mantenimiento <i class="fas fa-chevron-down"></i></a>
                    <div class="dropdown-content">
                        ${allowedSections.mantenimiento.includes('usuarios') ? `<a href="../pages/usuarios.html"><i class="fas fa-user"></i> Usuarios</a>` : ''}
                        ${allowedSections.mantenimiento.includes('clientes') ? `<a href="../pages/clientes.html"><i class="fas fa-users"></i> Clientes</a>` : ''}
                        ${allowedSections.mantenimiento.includes('habitacion') ? `<a href="../pages/M_habitaciones.html"><i class="fas fa-bed"></i> Habitacion</a>` : ''}
                        ${allowedSections.mantenimiento.includes('productos') ? `<a href="../pages/T_productos.html"><i class="fas fa-box"></i> Productos</a>` : ''}
                    </div>
                </li>` : ''}
                ${allowedSections.reportes ? `<li><a href="../pages/R_recepcion.html"><i class="fas fa-chart-bar"></i> Reportes</a></li>` : ''}
            </ul>
        </div>
    `;

    // Seleccionar el contenedor principal donde insertar el sidebar
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (dashboardContainer) {
        dashboardContainer.insertAdjacentHTML('afterbegin', sidebarHTML);
        dashboardContainer.classList.add('loaded');
    }
});

// Insertar la barra lateral en las páginas
// document.addEventListener('DOMContentLoaded', () => {
//     const sidebarHTML = `
//         <div class="sidebar">
//             <h2>HODELPA</h2>
//             <br><br>
//             <ul>
//                 <li><a href="../pages/dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>
//                 <li class="dropdown">
//                     <a href="#" class="dropbtn"><i class="fas fa-hotel"></i> Gestion <i class="fas fa-chevron-down"></i></a>
//                     <div class="dropdown-content">
//                         <a href="../pages/G_recepcion.html"><i class="fas fa-concierge-bell"></i> Recepcion</a>
//                         <a href="../pages/G_reservaciones.html"><i class="fas fa-calendar-check"></i> Reservas</a>
//                         <a href="../pages/G_salida.html"><i class="fas fa-door-open"></i> Salida</a>
//                         <a href="../pages/M_limpieza.html"><i class="fas fa-broom"></i> Limpieza</a>
//                     </div>
//                 </li>
//                 <li class="dropdown">
//                     <a href="#" class="dropbtn"><i class="fas fa-store"></i> Tienda <i class="fas fa-chevron-down"></i></a>
//                     <div class="dropdown-content">
//                         <a href="../pages/T_vender.html"><i class="fas fa-shopping-cart"></i> Vender</a>
//                     </div>
//                 </li>
//                 <li class="dropdown">
//                     <a href="#" class="dropbtn"><i class="fas fa-tools"></i> Mantenimiento <i class="fas fa-chevron-down"></i></a>
//                     <div class="dropdown-content">
//                         <a href="../pages/usuarios.html"><i class="fas fa-user"></i> Usuarios</a>
//                         <a href="../pages/clientes.html"><i class="fas fa-users"></i> Clientes</a>
//                         <a href="../pages/M_habitaciones.html"><i class="fas fa-bed"></i> Habitacion</a>
//                         <a href="../pages/T_productos.html"><i class="fas fa-box"></i> Productos</a>
//                     </div>
//                 </li>
//                 <li><a href="../pages/R_recepcion.html"><i class="fas fa-chart-bar"></i> Reportes</a></li>
//             </ul>
//         </div>
//     `;

//     // Seleccionar el contenedor principal donde insertar el sidebar
//     const dashboardContainer = document.querySelector('.dashboard-container');
//     if (dashboardContainer) {
//         dashboardContainer.insertAdjacentHTML('afterbegin', sidebarHTML);
//         dashboardContainer.classList.add('loaded');
//     }
// });

// Script para abrir y cerrar el modal


document.getElementById('logoutButton').addEventListener('click', function() {
    document.getElementById('logoutModal').style.display = 'block';
});

document.getElementById('closeModal').addEventListener('click', function() {
    document.getElementById('logoutModal').style.display = 'none';
});

document.getElementById('cancelLogout').addEventListener('click', function() {
    document.getElementById('logoutModal').style.display = 'none';
});

// Cerrar el modal al hacer clic fuera de él
window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('logoutModal')) {
        document.getElementById('logoutModal').style.display = 'none';
    }
});

// Script para manejar los menús desplegables
document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        // Agregar el evento de clic solo al botón que despliega el menú
        dropdown.querySelector('.dropbtn').addEventListener('click', function(e) {
            e.preventDefault();

            // Cerrar otros menús abiertos
            dropdowns.forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('active');
                }
            });

            // Alternar el menú actual
            dropdown.classList.toggle('active');
        });
    });
});
