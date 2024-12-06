import { checkAuthorizationLoginPage } from '../auth/login.auth.js';
import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { handleLoginNotification } from '../scripts/utils.js';

/**
 * Inicializa el detector de eventos de envío del formulario de inicio de sesión.
 */
export async function loginIntegration() {
    document.querySelector('.login-form-section form').addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevenir comportamiento predeterminado del formulario

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(BACKEND_ROUTES.auth.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                // Guardar token en localStorage
                const token = await response.json();
                localStorage.setItem('jwt', token.access_token);
                console.log('Inicio de sesión exitoso.');

                // Redirigir según rol
                const [status, redirectPage] = checkAuthorizationLoginPage();
                handleLoginNotification(status, username, redirectPage);

                if (status === 'success') {
                    window.location.href = redirectPage; // Redirigir al usuario
                }
            } else {
                // Manejo de errores según el código de estado
                const errorMsg = await response.json();
                if (response.status === 401 && errorMsg.message === 'Usuario bloqueado. Contacte al administrador.') {
                    handleLoginNotification('userBlocked');
                } else {
                    handleLoginNotification('failed');
                }
            }
        } catch (error) {
            console.error('Error de red:', error);
            handleLoginNotification('network');
        }
    });
}
