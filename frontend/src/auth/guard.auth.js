import { validateJwt, setLogoutButton } from "./utils.auth.js";

// Mapa de permisos por página
const pagePermissions = {
    "clientes.html": ["ADMINISTRADOR"],
    "dashboard.html": ["ADMINISTRADOR", "RECEPCIONISTA", "GERENTE"],
    "G_check-in.html": ["ADMINISTRADOR", "RECEPCIONISTA"],
    "G_infoHabitacion.html": ["ADMINISTRADOR", "RECEPCIONISTA"],
    "G_recepcion.html": ["ADMINISTRADOR", "RECEPCIONISTA"],
    "G_registroReserva.html": ["ADMINISTRADOR", "RECEPCIONISTA"],
    "G_reservaciones.html": ["ADMINISTRADOR", "RECEPCIONISTA"],
    "G_reservas.html": ["ADMINISTRADOR", "RECEPCIONISTA"],
    "G_salida.html": ["ADMINISTRADOR", "RECEPCIONISTA"],
    "G_salidaHabitacion.html": ["ADMINISTRADOR", "RECEPCIONISTA"],
    "M_habitaciones.html": ["ADMINISTRADOR", "MANTENIMIENTO"],
    "M_limpieza.html": ["ADMINISTRADOR", "MANTENIMIENTO"],
    "R_recepcion.html": ["ADMINISTRADOR", "GERENTE"],
    "T_productos.html": ["ADMINISTRADOR"],
    "T_vender.html": ["ADMINISTRADOR", "RECEPCIONISTA"],
    "T_ventaHabitacion.html": ["ADMINISTRADOR", "RECEPCIONISTA"],
    "usuarios.html": ["ADMINISTRADOR"],
    "ofertas.html": ["ADMINISTRADOR", "GERENTE","RECEPCIONISTA"],
    "cuestionario.html": ["ADMINISTRADOR", "GERENTE","RECEPCIONISTA"],
    "login.html": [], // Todos tienen acceso
};

// Función para obtener el nombre de la página actual
const getCurrentPage = () => {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf("/") + 1); // Obtiene el nombre del archivo HTML
};

// Función para validar acceso
export const validateAccess = async () => {
    const user = await validateJwt(); // Obtener el usuario actual desde el JWT
    const currentPage = getCurrentPage(); // Obtener la página actual
    const allowedRoles = pagePermissions[currentPage] || []; // Obtener los roles permitidos
    
    // Configurar el botón de logout
    setLogoutButton(user);
    
    // Validar si el usuario tiene acceso
    if (!allowedRoles.includes(user.role)) {
        document.querySelector('body').innerHTML = '';
        console.error(`Acceso denegado: El rol '${user.role}' no tiene permiso para acceder a '${currentPage}'`);
        Swal.fire({
            icon: "error",
            title: "No autorizado",
            text: "No tienes permiso para acceder a esta página.",
        }).then(() => {
            window.location.href = "login.html"; // Redirigir al login
        });
        return;
    }  
    console.log(`Acceso permitido: El rol '${user.role}' tiene acceso a '${currentPage}'`);
};

