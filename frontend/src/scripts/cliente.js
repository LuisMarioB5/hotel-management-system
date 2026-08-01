import { getAllCustomers, createCustomer, updateCustomer } from '../integrations/customer.integration.js';

let allClients = [];
let currentPage = 1;
let recordsPerPage = 'All';

document.addEventListener('DOMContentLoaded', () => {
    loadClients();
    setupEventListeners();
});

async function loadClients() {
    try {
        allClients = await getAllCustomers();
        filterAndRenderClients();
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

function filterAndRenderClients() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    let filteredClients = allClients.filter(client =>
        Object.values(client).some(value =>
            value && value.toString().toLowerCase().includes(searchTerm)
        )
    );

    if (statusFilter === 'active') {
        filteredClients = filteredClients.filter(client => client.isActive);
    } else if (statusFilter === 'inactive') {
        filteredClients = filteredClients.filter(client => !client.isActive);
    }

    const totalFilteredRecords = filteredClients.length;

    if (recordsPerPage !== 'All') {
        const startIndex = (currentPage - 1) * parseInt(recordsPerPage);
        const endIndex = startIndex + parseInt(recordsPerPage);
        filteredClients = filteredClients.slice(startIndex, endIndex);
    }

    renderClients(filteredClients);
    updatePaginationInfo(totalFilteredRecords);
}

function renderClients(clients) {
    const tableBody = document.querySelector('table tbody');
    tableBody.innerHTML = '';

    clients.forEach(client => {
        const row = `
            <tr>
                <td>${client.documentType || 'N/A'}</td>
                <td>${client.documentNumber || 'N/A'}</td>
                <td>${client.name || 'N/A'}</td>
                <td>${client.lastName || 'N/A'}</td>
                <td>${client.phoneNumber || 'N/A'}</td>
                <td>${client.gender || 'N/A'}</td>
                <td>${client.email || 'N/A'}</td>
                <td><span class="status ${client.isActive ? 'active' : 'inactive'}">${client.isActive ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <label class="status-toggle" title="${client.isActive ? 'Desactivar' : 'Activar'}">
                        <input type="checkbox" class="status-toggle-input" data-id="${client.id}" ${client.isActive ? 'checked' : ''}>
                        <span class="status-toggle-slider"></span>
                    </label>
                    <button class="edit-btn" data-id="${client.id}"><i class="fas fa-edit"></i></button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

function updatePaginationInfo(totalFilteredRecords) {
    const paginationInfo = document.querySelector('.pagination-info label');
    const paginationButtons = document.querySelector('.pagination-buttons');

    if (recordsPerPage === 'All') {
        paginationInfo.textContent = `Mostrando todos los registros (${totalFilteredRecords})`;
        paginationButtons.style.display = 'none';
    } else {
        const totalPages = Math.ceil(totalFilteredRecords / parseInt(recordsPerPage));
        paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        paginationButtons.style.display = 'flex';
    }
}

function setupEventListeners() {
    const createButton = document.querySelector('.create-button');
    createButton.addEventListener('click', () => openModal());

    const saveButton = document.querySelector('.btn_saveusu');
    saveButton.addEventListener('click', handleSaveClient);

    document.querySelector('table').addEventListener('click', handleTableActions);
    document.querySelector('table').addEventListener('change', handleStatusToggle);

    const searchInput = document.getElementById('searchUser');
    searchInput.addEventListener('input', filterAndRenderClients);

    const statusFilter = document.getElementById('statusFilter');
    statusFilter.addEventListener('change', () => {
        currentPage = 1;
        filterAndRenderClients();
    });

    const recordsPerPageSelect = document.getElementById('recordsPerPage');
    recordsPerPageSelect.addEventListener('change', handleRecordsPerPageChange);

    const paginationButtons = document.querySelector('.pagination-buttons');
    paginationButtons.addEventListener('click', handlePaginationClick);
}

function handleRecordsPerPageChange(event) {
    recordsPerPage = event.target.value;
    currentPage = 1;
    filterAndRenderClients();
}

function handlePaginationClick(event) {
    if (event.target.classList.contains('pagination-btn')) {
        if (event.target.textContent === '<') {
            currentPage = Math.max(1, currentPage - 1);
        } else if (event.target.textContent === '>') {
            const totalFilteredRecords = allClients.filter(client => 
                Object.values(client).some(value => 
                    value && value.toString().toLowerCase().includes(document.getElementById('searchUser').value.toLowerCase())
                )
            ).length;
            const totalPages = Math.ceil(totalFilteredRecords / parseInt(recordsPerPage));
            currentPage = Math.min(totalPages, currentPage + 1);
        }
        filterAndRenderClients();
    }
}

function openModal(clientData = null) {
    const modal = document.getElementById('createUserModal');
    const modalTitle = modal.querySelector('.modalusu-header h2');
    const asideTitle = document.getElementById('modalAsideTitle');
    const asideText = document.getElementById('modalAsideText');
    const saveButton = modal.querySelector('.btn_saveusu');

    if (clientData) {
        modalTitle.textContent = 'Editar Cliente';
        if (asideTitle) asideTitle.innerHTML = 'Editar<br>Cliente';
        if (asideText) asideText.textContent = 'Actualiza la información del cliente seleccionado.';
        fillModalWithClientData(clientData);
        saveButton.setAttribute('data-id', clientData.id);
    } else {
        modalTitle.textContent = 'Crear Cliente';
        if (asideTitle) asideTitle.innerHTML = 'Crear<br>Cliente';
        if (asideText) asideText.textContent = 'Completa la información para registrar un nuevo cliente.';
        document.getElementById('tipo').value = 'CEDULA';
        document.getElementById('documento').value = '';
        document.getElementById('nombre').value = '';
        document.getElementById('apellido').value = '';
        document.getElementById('telefono').value = '';
        document.getElementById('sexo').value = 'masculino';
        document.getElementById('correo').value = '';
        document.getElementById('estado').value = 'Activo';
        saveButton.removeAttribute('data-id');
    }

    modal.style.display = 'flex';
}

function fillModalWithClientData(clientData) {
    document.getElementById('tipo').value = clientData.documentType;
    document.getElementById('documento').value = clientData.documentNumber;
    document.getElementById('nombre').value = clientData.name;
    document.getElementById('apellido').value = clientData.lastName;
    document.getElementById('telefono').value = clientData.phoneNumber;
    document.getElementById('sexo').value = clientData.gender.toLowerCase();
    document.getElementById('correo').value = clientData.email;
    document.getElementById('estado').value = clientData.isActive ? 'Activo' : 'Inactivo';
}

async function handleSaveClient() {
    // Validación de campos
    const tipo = document.getElementById('tipo').value;
    const documento = document.getElementById('documento').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const sexo = document.getElementById('sexo').value;
    const correo = document.getElementById('correo').value.trim();
    const estado = document.getElementById('estado').value === 'Activo';

    // Expresiones regulares para validaciones
    const docRegex = /^[a-zA-Z0-9-]+$/; // Documento: letras, números y guiones (ej. cédula 001-1234567-1)
    const nameRegex = /^[\p{L}\s]+$/u; // Letras (incluye tildes y ñ) y espacios
    const phoneRegex = /^[\d-]+$/; // Números y guiones
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;

    // Validar cada campo y mostrar mensajes de error
    if (!documento || !docRegex.test(documento)) {
        await showTemporaryAlert('error', 'Documento inválido', 'El documento solo debe contener letras y números.');
        return;
    }
    if (!nombre || !nameRegex.test(nombre)) {
        await showTemporaryAlert('error', 'Nombre inválido', 'El nombre solo debe contener letras.');
        return;
    }
    if (!apellido || !nameRegex.test(apellido)) {
        await showTemporaryAlert('error', 'Apellido inválido', 'El apellido solo debe contener letras.');
        return;
    }
    if (!telefono || !phoneRegex.test(telefono)) {
        await showTemporaryAlert('error', 'Teléfono inválido', 'El teléfono solo debe contener números.');
        return;
    }
    if (!correo || !emailRegex.test(correo)) {
        await showTemporaryAlert('error', 'Correo inválido', 'Por favor, ingrese un correo electrónico válido.');
        return;
    }

    // Confirmación para guardar los datos
    const result = await Swal.fire({
        icon: 'question',
        title: '¿Confirmar?',
        text: '¿Está seguro de que desea guardar los cambios?',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar',
        heightAuto: false,
        customClass: {
            container: 'swal-container',
        },
    });

    if (!result.isConfirmed) return;

    const clientData = {
        documentType: tipo,
        documentNumber: documento,
        name: nombre,
        lastName: apellido,
        phoneNumber: telefono,
        gender: sexo,
        email: correo,
        isActive: estado,
        heightAuto: false,
        customClass: {
            container: 'swal-container',
        },
    };

    const clientId = this.getAttribute('data-id');

    try {
        if (clientId) {
            await updateCustomer({ id: clientId, ...clientData });
        } else {
            await createCustomer(clientData);
        }
        closeModal();
        loadClients();
        await showTemporaryAlert('success', 'Éxito', 'El cliente se ha guardado correctamente.');
    } catch (error) {
        console.error('Error saving client:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al guardar el cliente.',
        });
    }
}

// Función para mostrar alertas temporales de 1.5 segundos
async function showTemporaryAlert(icon, title, text) {
    return Swal.fire({
        icon,
        title,
        text,
        showConfirmButton: false,
        timer: 1500,
        heightAuto: false
    });
}

function handleTableActions(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const clientId = target.getAttribute('data-id');
    if (target.classList.contains('edit-btn')) {
        handleEdit(clientId);
    }
}

async function handleStatusToggle(event) {
    if (!event.target.classList.contains('status-toggle-input')) return;

    const checkbox = event.target;
    const id = checkbox.getAttribute('data-id');
    const newState = checkbox.checked;

    checkbox.disabled = true;
    const result = await updateCustomer({ id, isActive: newState });
    checkbox.disabled = false;

    if (result) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: newState ? 'Cliente activado' : 'Cliente desactivado',
            showConfirmButton: false,
            timer: 1800,
            timerProgressBar: true,
        });
        loadClients();
    } else {
        checkbox.checked = !newState;
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'No se pudo actualizar el estado',
            showConfirmButton: false,
            timer: 2000,
        });
    }
}

async function handleEdit(clientId) {
    try {
        const client = allClients.find(c => c.id === parseInt(clientId));
        if (client) {
            openModal(client);
        } else {
            throw new Error('Client not found');
        }
    } catch (error) {
        console.error('Error fetching client data:', error);
        alert('Error al obtener los datos del cliente');
    }
}

function closeModal() {
    document.getElementById('createUserModal').style.display = 'none';
}

// Exponer funciones necesarias al objeto window para los manejadores de eventos en línea
window.closeModal = closeModal;
window.guardarCliente = handleSaveClient;



//----------------------------------------------------------------------------//
             ////ESTA PARTE ES PARA LA PAGINA DEL DASHBOARD///
//----------------------------------------------------------------------------//

async function updateCustomersCounts() {
    try {
        const customers = await getAllCustomers();  // Obtener todos los clientes
        const activeCustomers = customers.filter(customer => customer.isActive);  // Filtrar clientes activos
        const totalActiveCustomers = activeCustomers.length;    // Contar el total de clientes activos

        // Verificar si el elemento existe antes de actualizar el DOM
        const totalCliElement = document.getElementById('total-cli');
        if (totalCliElement) {
            totalCliElement.textContent = totalActiveCustomers;
        } else {
            //console.error("El elemento con el ID 'total-cli' no se encontró en el DOM.");
        }
    } catch (error) {
        //console.error('Error al actualizar el conteo de clientes:', error);
    }
}


async function loadLatestCustomers() {
    try {
        // Obtener todos los clientes
        const customers = await getAllCustomers();

        // Filtrar solo los clientes activos
        const activeCustomers = customers.filter(customer => customer.isActive);

        // Ordenar los clientes por ID de forma descendente y obtener los últimos 3
        const latestCustomers = activeCustomers.sort((a, b) => b.id - a.id).slice(0, 3);

        // Verificar si el contenedor existe antes de actualizar el DOM
        const latestCustomersContainer = document.querySelector('.latest-section .latest-content.cliente');
        if (latestCustomersContainer) {
            latestCustomersContainer.innerHTML = ''; // Limpiar contenido anterior

            latestCustomers.forEach(client => {
                const clientElement = document.createElement('div');
                clientElement.classList.add('item');
                clientElement.innerHTML = `
                    <div class="item-avatar">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="item-info">
                        <div class="item-title">${client.name} ${client.lastName}</div>
                        <div class="item-subtitle"><span>${client.documentType}:</span> ${client.documentNumber}</div>
                    </div>
                `;
                latestCustomersContainer.appendChild(clientElement);
            });
        } else {
           console.error("El contenedor de los últimos clientes no se encontró en el DOM.");
        }
    } catch (error) {
        console.error('Error al cargar los últimos clientes:', error);
    }
}


// Llamar a las funciones al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    updateCustomersCounts();  // Para mostrar el total de clientes
    loadLatestCustomers();   // Para mostrar los últimos 3 clientes
});


