import { validateJwt } from "../authUtils.js";

export function checkAuthorizationLoginPage() {
    const user = validateJwt();
<<<<<<< Updated upstream
=======
    console.log(user)
    console.log(user.role)
>>>>>>> Stashed changes
    if(user.role === 'ADMINISTRADOR' || user.role === 'GERENTE'){
        return ['success', 'dashboard.html'];
    } else if(user.role === 'RECEPCIONISTA') {
        return ['success', 'dashboard.html'];
    } else if(user.role === 'MANTENIMIENTO') {
        return ['success', 'dashboard.html'];
    } else {
        return ['failed', 'dashboard.html'];
    }
}