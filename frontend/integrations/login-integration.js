import { handleLoginNotification, parseJwt } from '../scripts/utils.js'

async function loginIntegration() {
    document.querySelector('.form-section form').addEventListener('submit', async function(event) {
        event.preventDefault();
        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:8080/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const token = response.headers.get('Authorization').replace('Bearer ', '');
                localStorage.setItem('jwt', token);
                console.log('Inicio de sesión exitoso', token);
                handleLoginNotification('success', username, 'dashboard.html');
            } 
            
            if (response.status == 401) {
                console.error('No tiene autorización para logearse, sus credenciales son incorrectas');
                handleLoginNotification('failed');
            }
            
        } catch (error) {
            console.error('Error de red', error);
            handleLoginNotification('network');
        }
    });
}
loginIntegration();
