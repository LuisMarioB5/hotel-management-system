import { validateJwt } from "./utils.auth.js";

export function checkAuthorizationLoginPage() {
    const user = validateJwt();

    // Mapa de redirección basado en roles
    const roleRedirects = {
        ADMINISTRADOR: 'dashboard.html',
        GERENTE: 'dashboard.html',
        RECEPCIONISTA: 'G_recepcion.html',
        MANTENIMIENTO: 'M_habitaciones.html',
    };

    // Verificar si el rol tiene una página asignada
    const redirectPage = roleRedirects[user.role];

    if (redirectPage) {
        return ['success', redirectPage];
    } else {
        console.error(`Rol desconocido o sin permiso: ${user.role}`);
        return ['failed', 'login.html']; // Redirigir a login en caso de rol no válido
    }
}
