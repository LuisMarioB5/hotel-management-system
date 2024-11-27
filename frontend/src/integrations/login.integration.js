import { checkAuthorizationLoginPage } from '../auth/pages/login.auth.js';
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
                localStorage.removeItem('jwt');
                localStorage.setItem('jwt', token.access_token);
                console.log('Inicio de sesión exitoso. Token almacenado correctamente');
                const status = checkAuthorizationLoginPage();
                handleLoginNotification(status[0], username, status[1]);
            } 
            else if (response.status === 401) {
                const errorMsg = await response.json();
                if(errorMsg.message === 'Usuario bloqueado. Contacte al administrador.') {
                    console.error('Su usuario esta bloqueado, debe contactar a un administrador para desbloquear su cuenta.');
                    handleLoginNotification('userBlocked');
                } else {
                    console.error('No tiene autorización para logearse, sus credenciales son incorrectas');
                    handleLoginNotification('failed');
                }
            }
            else if(response.status === 404) {
                console.error('No tiene autorización para logearse, sus credenciales son incorrectas');
                handleLoginNotification('failed');
            }
            
        } catch (error) {
            console.error('Error de red', error);
            handleLoginNotification('network');
        }
    });
}
