import { setLogoutButton, validateJwt } from "../authUtils.js";

function checkAuthorizationUsersPage() {
    const user = validateJwt();
    setLogoutButton(user);

    if(user.role !== 'ADMINISTRADOR') {
        const body = document.querySelector('body');
        if(body) {
            body.innerHTML = '';
        }
        console.error('No tienes permiso para acceder, tu rol es:', user.role)
        Swal.fire({
            icon: 'error',
            title: 'No autorizado',
            text: 'No tienes permiso para acceder a esta página.',
        }).then(() => {
            window.location.href = 'login.html';
        });
    }
}
checkAuthorizationUsersPage();
