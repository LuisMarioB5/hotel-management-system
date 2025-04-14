import { getAllCustomers, createCustomer, updateCustomer } from '../integrations/customer.integration.js';

let allClients = [];
let currentPage = 1;
let recordsPerPage = 10;

document.addEventListener('DOMContentLoaded', async () => {
    allClients = (await getAllCustomers()).filter(client => client.isActive); // Filtrar solo los clientes activos
    loadClients();
    setupEventListeners();
});

function loadClients() {
    filterAndRenderClients();
}

function filterAndRenderClients() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    let filteredClients = allClients.filter(client =>
        Object.values(client).some(value =>
            value && value.toString().toLowerCase().includes(searchTerm)
        )
    );

    const totalFilteredRecords = filteredClients.length;

    // Calcular los clientes a mostrar según la página actual
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    filteredClients = filteredClients.slice(startIndex, endIndex);

    renderClients(filteredClients);
    updatePaginationInfo(totalFilteredRecords);
}

function renderClients(clients) {
    const tableBody = document.querySelector('table tbody');
    tableBody.innerHTML = '';

    clients.forEach(client => {
        const row = `
            <tr data-id="${client.id}" data-gender="${client.gender}">
                <td>${client.documentType || 'N/A'}</td>
                <td>${client.documentNumber || 'N/A'}</td>
                <td>${client.name || 'N/A'}</td>
                <td>${client.lastName || 'N/A'}</td>
                <td>${client.phoneNumber || 'N/A'}</td>
                <td>${client.email || 'N/A'}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}


function updatePaginationInfo(totalFilteredRecords) {
    const paginationInfo = document.querySelector('.pagination-info label');
    const paginationButtons = document.querySelector('.pagination-buttons');

    const totalPages = Math.ceil(totalFilteredRecords / recordsPerPage);
    paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;

    renderPaginationButtons(totalPages);
}

function renderPaginationButtons(totalPages) {
    const paginationButtons = document.querySelector('.pagination-buttons');
    paginationButtons.innerHTML = '';

    if (totalPages > 1) {
        if (currentPage > 1) {
            paginationButtons.insertAdjacentHTML('beforeend', `<button class="pagination-btn" data-action="prev"><</button>`);
        }
        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === currentPage ? 'active' : '';
            paginationButtons.insertAdjacentHTML('beforeend', `<button class="pagination-btn ${isActive}" data-page="${i}">${i}</button>`);
        }
        if (currentPage < totalPages) {
            paginationButtons.insertAdjacentHTML('beforeend', `<button class="pagination-btn" data-action="next">></button>`);
        }
    }
}

function handlePaginationClick(event) {
    const action = event.target.getAttribute('data-action');
    const totalFilteredRecords = allClients.filter(client =>
        Object.values(client).some(value =>
            value && value.toString().toLowerCase().includes(document.getElementById('searchUser').value.toLowerCase())
        )
    ).length;
    const totalPages = Math.ceil(totalFilteredRecords / recordsPerPage);

    if (action === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (action === 'next' && currentPage < totalPages) {
        currentPage++;
    } else if (event.target.hasAttribute('data-page')) {
        const targetPage = parseInt(event.target.getAttribute('data-page'));
        if (targetPage >= 1 && targetPage <= totalPages) {
            currentPage = targetPage;
        }
    }

    filterAndRenderClients();
}

function setupEventListeners() {
    document.getElementById('searchUser').addEventListener('input', () => {
        currentPage = 1; // Reiniciar a la primera página al buscar
        filterAndRenderClients();
    });

    document.getElementById('recordsPerPage').addEventListener('change', event => {
        recordsPerPage = parseInt(event.target.value);
        currentPage = 1; // Reiniciar a la primera página al cambiar el número de registros
        filterAndRenderClients();
    });

    document.querySelector('.pagination-buttons').addEventListener('click', handlePaginationClick);
}

// Aquí se encuentran todas tus funciones y event listeners actuales

// Añadir event listener para el doble clic en las filas de la tabla del modal
document.querySelector('table tbody').addEventListener('dblclick', async event => {
    const targetRow = event.target.closest('tr');

    if (targetRow) {
        const cells = targetRow.getElementsByTagName('td');
        const id = targetRow.getAttribute('data-id');
        const gender = targetRow.getAttribute('data-gender');
        const nombreCliente = cells[2].innerText || 'N/A';

        // Asignar valores a los campos del formulario
        document.getElementById('cliente-id').value = id || 'N/A';
        document.getElementById('tipo').value = cells[0].innerText || 'N/A';
        document.getElementById('nroDocumento').value = cells[1].innerText || 'N/A';
        document.getElementById('nombre').value = nombreCliente;
        document.getElementById('apellido').value = cells[3].innerText || 'N/A';
        document.getElementById('telefono').value = cells[4].innerText || 'N/A';
        document.getElementById('correo').value = cells[5].innerText || 'N/A';
        document.getElementById('sexo').value = gender || 'N/A';

        // Obtener las preferencias del cliente
        try {
            const response = await fetch(`http://localhost:3000/preferences/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar las preferencias del cliente');
            }

            const preferences = await response.json();

            // Disparar un evento personalizado para notificar a cuestionario.js
            const clientSelectedEvent = new CustomEvent('clientSelected', {
                detail: {
                    customerId: id,
                    preferences: preferences,
                },
            });
            document.dispatchEvent(clientSelectedEvent);

            // Mostrar alerta con el nombre del cliente
            Swal.fire({
                icon: 'success',
                title: `Cliente ${nombreCliente} seleccionado`,
                showConfirmButton: false,
                timer: 1000,
                timerProgressBar: true,
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });

            // Cerrar el modal después de seleccionar un cliente
            closeModal();
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: `No se pudieron cargar las preferencias: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'Aceptar',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
        }
    }
});

function closeModal() {
    document.getElementById('createUserModal').style.display = 'none';
}

// Event listeners adicionales
document.addEventListener('DOMContentLoaded', async () => {
    allClients = (await getAllCustomers()).filter(client => client.isActive); // Filtrar solo los clientes activos
    loadClients();
    setupEventListeners();
});
