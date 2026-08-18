import { validateJwt } from "../auth/utils.auth.js";
import { validateAccess } from '../auth/guard.auth.js';

// Aplicar el tema guardado lo antes posible
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

document.addEventListener('DOMContentLoaded', async () => {
    // Validar que el usuario tiene permisos para acceder a la pagina
    validateAccess();

    // Obtener el rol del usuario
    const user = await validateJwt();
    const role = user?.role || null; // Obtener el rol del usuario o null si no está definido

    // Rellenar la tarjeta de perfil del topbar (si la página la tiene)
    const profileName = document.querySelector('.profile-name');
    if (profileName) profileName.textContent = user?.username || 'Usuario';

    const roleIconMeta = {
        ADMINISTRADOR: { icon: 'fa-crown', color: '#8A4DFF' },
        RECEPCIONISTA: { icon: 'fa-bell', color: '#2F6BFF' },
        GERENTE: { icon: 'fa-briefcase', color: '#E5951E' },
        MANTENIMIENTO: { icon: 'fa-wrench', color: '#1EB1C3' },
    };
    const profileRoleIcon = document.querySelector('.profile-role-icon');
    if (profileRoleIcon) {
        const meta = roleIconMeta[role];
        if (meta) {
            profileRoleIcon.classList.add(meta.icon);
            profileRoleIcon.style.backgroundColor = meta.color;
            profileRoleIcon.title = role.charAt(0) + role.slice(1).toLowerCase();
        } else {
            profileRoleIcon.style.display = 'none';
        }
    }

    // Definir permisos por rol (basado en la matriz de acceso)
    const permissions = {
        ADMINISTRADOR: {
            dashboard: true,
            gestion: ['recepcion', 'reservas', 'salida', 'limpieza'],
            tienda: ['vender'],
            mantenimiento: ['usuarios', 'clientes', 'habitacion', 'productos'],
            reportes: true,
            ofertas: true,
            cuestionario: true,
        },
        RECEPCIONISTA: {
            dashboard: true,
            gestion: ['recepcion', 'reservas', 'salida'],
            tienda: ['vender'],
            mantenimiento: [],
            reportes: false,
            ofertas: true,
            cuestionario: true,
        },
        GERENTE: {
            dashboard: true,
            gestion: [],
            tienda: [],
            mantenimiento: [],
            reportes: true,
            ofertas: true,
            cuestionario: true,
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

    // Página actual, para marcar el link activo del sidebar
    const currentPage = window.location.pathname.split('/').pop();
    const isActive = (page) => (currentPage === page ? 'active' : '');

    const panelLabels = {
        ADMINISTRADOR: 'Panel de Administración',
        RECEPCIONISTA: 'Panel de Recepción',
        GERENTE: 'Panel de Gerencia',
        MANTENIMIENTO: 'Panel de Mantenimiento',
    };
    const panelLabel = panelLabels[role] || 'Panel de Control';

    // Crear el HTML dinámico del sidebar
    const sidebarHTML = `
        <div class="sidebar">
            <div class="sidebar-brand">
                <img src="../../public/assets/login-img.jpg" alt="Hotel Hodelpa" class="sidebar-brand-img">
                <h2 class="sidebar-brand-title">HODELPA</h2>
                <p class="sidebar-brand-subtitle">${panelLabel}</p>
            </div>
            <ul>
                ${allowedSections.dashboard ? `<li><a href="../pages/dashboard.html" class="${isActive('dashboard.html')}"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>` : ''}
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
                ${allowedSections.reportes ? `<li><a href="../pages/R_recepcion.html" class="${isActive('R_recepcion.html')}"><i class="fas fa-chart-bar"></i> Reportes</a></li>` : ''}
                ${allowedSections.ofertas ? `<li><a href="../pages/ofertas.html" class="${isActive('ofertas.html')}"><i class="fas fa-gift"></i> Ofertas</a></li>` : ''}
            </ul>
            <div class="sidebar-theme-toggle">
                <span><i class="fas fa-moon"></i> Modo oscuro</span>
                <label class="theme-switch">
                    <input type="checkbox" id="themeToggleInput">
                    <span class="theme-switch-slider"></span>
                </label>
            </div>
            <button type="button" class="sidebar-logout">
                <i class="fas fa-arrow-right-from-bracket"></i> Cerrar sesión
            </button>
        </div>
    `;

    // Seleccionar el contenedor principal donde insertar el sidebar
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (dashboardContainer) {
        dashboardContainer.insertAdjacentHTML('afterbegin', sidebarHTML);
        dashboardContainer.classList.add('loaded');

        const sidebarLogout = dashboardContainer.querySelector('.sidebar-logout');
        if (sidebarLogout) {
            sidebarLogout.addEventListener('click', () => {
                document.getElementById('logoutModal').style.display = 'block';
            });
        }

        const themeToggleInput = dashboardContainer.querySelector('#themeToggleInput');
        if (themeToggleInput) {
            themeToggleInput.checked = savedTheme === 'dark';
            themeToggleInput.addEventListener('change', () => {
                const theme = themeToggleInput.checked ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', theme);
                localStorage.setItem('theme', theme);
            });
        }

        // Botón hamburguesa y overlay para mostrar/ocultar el sidebar en pantallas chicas
        const sidebarEl = dashboardContainer.querySelector('.sidebar');
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'sidebar-toggle-btn';
        toggleBtn.setAttribute('aria-label', 'Abrir menú');
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';

        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';

        document.body.appendChild(toggleBtn);
        document.body.appendChild(backdrop);

        const closeSidebar = () => {
            sidebarEl.classList.remove('mobile-open');
            backdrop.classList.remove('active');
        };
        const openSidebar = () => {
            sidebarEl.classList.add('mobile-open');
            backdrop.classList.add('active');
        };

        toggleBtn.addEventListener('click', () => {
            sidebarEl.classList.contains('mobile-open') ? closeSidebar() : openSidebar();
        });
        backdrop.addEventListener('click', closeSidebar);
        sidebarEl.querySelectorAll('a').forEach(link => link.addEventListener('click', closeSidebar));
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
