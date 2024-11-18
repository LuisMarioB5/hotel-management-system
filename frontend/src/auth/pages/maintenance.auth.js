import { setLogoutButton, validateJwt } from "../authUtils.js";

async function checkAuthorizationMaintenancePage() {    
    const user = validateJwt();
    setLogoutButton(user);

    if(user.role == 'RECEPCIONISTA') {
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
    } else if(user.role === 'GERENTE') {
        await waitFewSeconds();

        /* Menu Vertical */
        setSidebarGerente();
        
        /* Tabla de las reservas */
        // Oculta el titulo de la ultima columna (acciones)
        const lastTitle = document.querySelector('table thead tr th:last-of-type');
        if(lastTitle) lastTitle.style.display = 'none';

        const rows = await selectRowsAfterWait();
        rows.forEach(row => {
            // Oculta el contenido de la ultima columna de la tabla
            row.querySelector('td:last-of-type').style.display = 'none';

            const statusCol = row.querySelector('td:nth-of-type(7)');
            statusCol.classList.add('statusCol');
            statusCol.classList.add('paddingRight');
        })
    }
}

function waitFewSeconds() {
    return new Promise((resolve) => {
        setTimeout(resolve, 200); // Espera 0.15 segundos
    });
}

async function selectRowsAfterWait() {
    const rows = document.querySelectorAll('#roomTable tbody tr');
    if (rows.length > 0) {
        return rows;
    } else {
        console.error('No se encontraron filas. Intenta nuevamente.');
    }
}

export async function setSidebarGerente() {
    const sidebarDropdown = document.querySelectorAll('.sidebar ul li.dropdown');
    if (!sidebarDropdown) {
        console.error('No se encontraron los dropdowns del sidebar');
        return
    }
    sidebarDropdown[0].style.display = 'none';
    sidebarDropdown[1].style.display = 'none';
    
    const maintenanceDropdown = sidebarDropdown[2];
    if(!maintenanceDropdown) {
        console.error('No se encontro el dropdown de mantenimiento');
        return
    }
    maintenanceDropdown.addEventListener('click', () =>{
        if(maintenanceDropdown.classList.contains('active')){
            const items = maintenanceDropdown.querySelectorAll('div a:not(.dropbtn)');
            items.forEach(item => {
                item.style.display = 'none';
            });
            items[2].style.display = 'inline-block';
        }
    });
    console.log('fin')
    return;
}

if(document.URL.endsWith('M_habitaciones.html' || 'M_limpieza.html')) {
    checkAuthorizationMaintenancePage();
}
