/**
 * Valida el JWT almacenado en localStorage.
 * - Comprueba si el token existe.
 * - Valida el formato del token utilizando parseJwt.
 * - Verifica si el token ha expirado.
 * 
 * @returns {Object} `user` Objecto clave-valor si el token es válido, `false` si no lo es.
 */
export function validateJwt() {
    const token = localStorage.getItem('jwt');

    // 1. Validar si el token existe
    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'No autorizado',
            text: 'Debes iniciar sesión para acceder a esta página.',
        }).then(() => {
            window.location.href = 'login.html';
        });
        return false;
    }

    // 2. Decodificar el token
    const user = parseJwt(token);
    if (!user) {
        Swal.fire({
            icon: 'error',
            title: 'Error en el token',
            text: 'El token es inválido o está malformado.',
        }).then(() => {
            localStorage.removeItem('jwt');
            window.location.href = 'login.html';
        });
        return false;
    }

    // 3. Verificar si el token ha expirado
    const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
    if (user.exp < currentTime) {
        Swal.fire({
            icon: 'warning',
            title: 'Sesión expirada',
            text: 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.',
        }).then(() => {
            localStorage.removeItem('jwt');
            window.location.href = 'login.html';
        });
        return false;
    }

    // Token válido
    return user;
}

/**
 * Decodifica un token JWT.
 * @param {string} token - El token JWT.
 * @returns {Object|null} El payload decodificado o `null` si el token no es válido.
 */
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decodificando el token:', error);
        return null;
    }
}

export function setLogoutButton(user) {
    const btn = document.getElementById('logoutButton');
    if(btn) {
        btn.innerHTML = `${user.username} <i class="fas fa-user"></i>`;
    }
}