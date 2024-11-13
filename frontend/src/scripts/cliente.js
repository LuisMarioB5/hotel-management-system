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
    let filteredClients = allClients.filter(client => 
        Object.values(client).some(value => 
            value && value.toString().toLowerCase().includes(searchTerm)
        )
    );

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

    const searchInput = document.getElementById('searchUser');
    searchInput.addEventListener('input', filterAndRenderClients);

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
    const saveButton = modal.querySelector('.btn_saveusu');

    if (clientData) {
        modalTitle.textContent = 'Editar Cliente';
        fillModalWithClientData(clientData);
        saveButton.setAttribute('data-id', clientData.id);
    } else {
        modalTitle.textContent = 'Crear Cliente';
        document.getElementById('tipo').value = 'Cedula';
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

function handleTableActions(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const clientId = target.getAttribute('data-id');
    if (target.classList.contains('edit-btn')) {
        handleEdit(clientId);
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

// Expose necessary functions to window object for inline event handlers
window.closeModal = closeModal;
window.guardarCliente = handleSaveClient;