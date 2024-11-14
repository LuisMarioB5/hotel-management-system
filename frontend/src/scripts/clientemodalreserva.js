import { getAllCustomers, createCustomer, updateCustomer } from '../integrations/customer.integration.js';

let allClients = [];
let currentPage = 1;
let recordsPerPage = 10;  // Default a 10 registros por página

document.addEventListener('DOMContentLoaded', async () => {
    allClients = await getAllCustomers();
    loadClients();
    setupEventListeners();
});

function loadClients() {
    const searchInput = document.getElementById('searchUser');
    const recordsPerPageSelect = document.getElementById('recordsPerPage');
    const paginationButtons = document.querySelector('.pagination-buttons');

    searchInput.addEventListener('input', filterAndRenderClients);
    recordsPerPageSelect.addEventListener('change', handleRecordsPerPageChange);
    paginationButtons.addEventListener('click', handlePaginationClick);

    filterAndRenderClients();  // Inicializar la vista de los clientes
}

function filterAndRenderClients() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    let filteredClients = allClients.filter(client =>
        Object.values(client).some(value =>
            value && value.toString().toLowerCase().includes(searchTerm)
        )
    );

    const totalFilteredRecords = filteredClients.length;

    // Calculamos los clientes a mostrar en la página actual, según los registros por página
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
            <tr>
                <td>${client.documentType || 'N/A'}</td>
                <td>${client.documentNumber || 'N/A'}</td>
                <td>${client.name || 'N/A'}</td>
                <td>${client.lastName || 'N/A'}</td>
                <td>${client.phoneNumber || 'N/A'}</td>
                <td>${client.gender || 'N/A'}</td>
                <td>${client.email || 'N/A'}</td>
                <td><span class="status ${client.isActive ? 'active' : 'inactive'}">${client.isActive ? 'Activo' : 'Inactivo'}</span></td>
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

    paginationButtons.style.display = 'flex';
    renderPaginationButtons(totalPages);
}

function renderPaginationButtons(totalPages) {
    const paginationButtons = document.querySelector('.pagination-buttons');
    paginationButtons.innerHTML = ''; // Limpiar botones existentes

    if (totalPages > 1) {
        const prevButton = `<button class="pagination-btn" data-action="prev"><</button>`;
        const nextButton = `<button class="pagination-btn" data-action="next">></button>`;
        
        paginationButtons.insertAdjacentHTML('beforeend', prevButton);
        paginationButtons.insertAdjacentHTML('beforeend', nextButton);
    }
}

function handleRecordsPerPageChange(event) {
    recordsPerPage = parseInt(event.target.value);
    currentPage = 1;  // Reset to the first page
    filterAndRenderClients();
}

function handlePaginationClick(event) {
    const totalFilteredRecords = allClients.filter(client =>
        Object.values(client).some(value =>
            value && value.toString().toLowerCase().includes(document.getElementById('searchUser').value.toLowerCase())
        )
    ).length;
    const totalPages = Math.ceil(totalFilteredRecords / recordsPerPage);

    const action = event.target.getAttribute('data-action');
    if (action === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (action === 'next' && currentPage < totalPages) {
        currentPage++;
    } else {
        currentPage = parseInt(event.target.getAttribute('data-page'));
    }

    filterAndRenderClients();
}

function setupEventListeners() {
    const createButton = document.querySelector('.create-button');
    createButton.addEventListener('click', () => openModal());

    const saveButton = document.querySelector('.btn_saveusu');
    saveButton.addEventListener('click', handleSaveClient);

    document.querySelector('table').addEventListener('dblclick', handleTableDoubleClick);
}

async function handleSaveClient() {
    if (!confirm('¿Está seguro de que desea guardar los cambios?')) {
        return;
    }

    const clientData = {
        documentType: document.getElementById('tipo').value,
        documentNumber: document.getElementById('documento').value,
        name: document.getElementById('nombre').value,
        lastName: document.getElementById('apellido').value,
        phoneNumber: document.getElementById('telefono').value,
        gender: document.getElementById('sexo').value,
        email: document.getElementById('correo').value,
        isActive: document.getElementById('estado').value === 'Activo'
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
    } catch (error) {
        console.error('Error saving client:', error);
        alert('Error al guardar el cliente');
    }
}

function handleTableDoubleClick(event) {
    const target = event.target.closest('tr');
    if (!target) return;

    const clientId = target.querySelector('.edit-btn').getAttribute('data-id');
    const client = allClients.find(c => c.id === parseInt(clientId));
    if (client) {
        fillModalWithClientData(client);
        openModal(client);
    }
}

function openModal(clientData = null) {
    const modal = document.getElementById('createUserModal');
    const modalTitle = modal.querySelector('.modalusu-header h2');
    const saveButton = modal.querySelector('.btn_saveusu');

    if (clientData) {
        modalTitle.textContent = 'Editar Cliente';
        fillModalWithClientData(clientData);
        saveButton.setAttribute('data-id', clientData.id);
    } else {
        modalTitle.textContent = 'Crear Cliente';
        resetModal();
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

function resetModal() {
    document.getElementById('tipo').value = 'Cedula';
    document.getElementById('documento').value = '';
    document.getElementById('nombre').value = '';
    document.getElementById('apellido').value = '';
    document.getElementById('telefono').value = '';
    document.getElementById('sexo').value = 'masculino';
    document.getElementById('correo').value = '';
    document.getElementById('estado').value = 'Activo';
}
