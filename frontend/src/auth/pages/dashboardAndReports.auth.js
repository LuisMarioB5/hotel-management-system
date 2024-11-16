import { setLogoutButton, validateJwt } from "../authUtils.js";

function checkAuthorizationDashboardAndReportsPage() {
    const user = validateJwt();
    setLogoutButton(user);

    if(user.role === 'RECEPCIONISTA' || user.role === 'MANTENIMINETO') {
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
checkAuthorizationDashboardAndReportsPage();
