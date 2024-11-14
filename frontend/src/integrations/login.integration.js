import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { handleLoginNotification } from '../scripts/utils.js'

/**
 * Inicializa el detector de eventos de envío del formulario de inicio de sesión.
 * Esta función intercepta el envío del formulario, envía las credenciales de inicio de sesión al backend y almacena el token JWT si el inicio de sesión es exitoso.
 * En caso de éxito o fracaso, se muestran las notificaciones correspondientes al usuario.
 * 
 * @async
 * @function loginIntegration
 */
export async function loginIntegration() {
    document.querySelector('.login-form-section form').addEventListener('submit', async function(event) {
        event.preventDefault();
        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;

        try {
            const response = await fetch(BACKEND_ROUTES.auth.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const token = await response.json();
                localStorage.setItem('jwt', token.access_token);
                console.log('Inicio de sesión exitoso. Token almacenado correctamente');
                handleLoginNotification('success', username, 'dashboard.html');
            } 
            
            if (response.status === 401 || response.status === 404) {
                console.error('No tiene autorización para logearse, sus credenciales son incorrectas');
                handleLoginNotification('failed');
            }
            
        } catch (error) {
            console.error('Error de red', error);
            handleLoginNotification('network');
        }
    });
}
