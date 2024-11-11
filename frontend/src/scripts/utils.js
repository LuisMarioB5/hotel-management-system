// Descomentar si el proyecto paso por completo a REACT
// import Swal from "sweetalert2";

export function handleLoginNotification(state, username, url) {
    switch(state) {
        case 'success':
            return  Swal.fire({
                        title: 'Inicio de Sesión Exitoso',
                        text: `Bienvenido/a, ${username}. Su inicio de sesión fue exitoso. Presione 'Aceptar' para continuar.`,
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = `${url}`;
                        }
                    });
        
        case 'failed':
            return  Swal.fire({
                        title: 'Error de Inicio de Sesión',
                        text: 'No tiene autorización para logearse, sus credenciales son incorrectas. Por favor, intente nuevamente.',
                        icon: 'error',
                        confirmButtonText: 'Aceptar'
                    });
                    
        case 'network':
            return  Swal.fire({
                        title: 'Error de Conexión',
                        text: 'Hubo un problema al intentar conectar con el servidor. Verifique su conexión a internet o intente nuevamente más tarde.',
                        icon: 'warning',
                        confirmButtonText: 'Reintentar'
                    });
    }

}

export function parseJwt(token) {
    // Divide el token en sus tres partes
    const base64Url = token.split('.')[1];
    // Decodifica el payload de Base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    // Convierte el payload JSON a un objeto JavaScript
    return JSON.parse(jsonPayload);
}

/**
 * Valida que un parámetro no sea nulo o indefinido.
 * @function validateParamIsNotNull
 * @param {string} paramName - El nombre del parámetro.
 * @param {*} paramValue - El valor del parámetro.
 * @throws {TypeError} Lanza un error si el parámetro es nulo o indefinido.
 */
export function validateParamIsNotNull(paramName, paramValue) {
    if (paramValue === null || paramValue === undefined) {
        throw new TypeError(`El parámetro '${paramName}' es obligatorio y no puede ser nulo o indefinido.`);
    }
}