import { getAllUsers, createUser, updateUser, deleteUser, getUserByUsername, getUserById } from '../integrations/user.integration.js';

let allUsers = [];
let currentPage = 1;
let recordsPerPage = 'All';

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setupEventListeners();
});

async function loadUsers() {
    try {
        allUsers = await getAllUsers();
        filterAndRenderUsers();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function filterAndRenderUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    let filteredUsers = allUsers.filter(user => 
        user.id.toString().toLowerCase().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm) ||
        (user.isActive ? 'activo' : 'inactivo').includes(searchTerm)
    );

    const totalFilteredRecords = filteredUsers.length;

    if (recordsPerPage !== 'All') {
        const startIndex = (currentPage - 1) * parseInt(recordsPerPage);
        const endIndex = startIndex + parseInt(recordsPerPage);
        filteredUsers = filteredUsers.slice(startIndex, endIndex);
    }

    renderUsers(filteredUsers);
    updatePaginationInfo(totalFilteredRecords);
}

function renderUsers(users) {
    const tableBody = document.querySelector('#userTable tbody');
    tableBody.innerHTML = '';

    users.forEach(user => {
        const row = `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td><span class="status ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button class="edit-btn" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${user.id}"><i class="fas fa-trash-alt"></i></button>
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
    saveButton.addEventListener('click', handleSaveUser);

    document.querySelector('#userTable').addEventListener('click', handleTableActions);

    const searchInput = document.getElementById('searchUser');
    searchInput.addEventListener('input', filterAndRenderUsers);

    const recordsPerPageSelect = document.getElementById('recordsPerPage');
    recordsPerPageSelect.addEventListener('change', handleRecordsPerPageChange);

    const paginationButtons = document.querySelector('.pagination-buttons');
    paginationButtons.addEventListener('click', handlePaginationClick);
}

function handleRecordsPerPageChange(event) {
    recordsPerPage = event.target.value;
    currentPage = 1;
    filterAndRenderUsers();
}

function handlePaginationClick(event) {
    if (event.target.classList.contains('pagination-btn')) {
        if (event.target.textContent === '<') {
            currentPage = Math.max(1, currentPage - 1);
        } else if (event.target.textContent === '>') {
            const totalFilteredRecords = allUsers.filter(user => 
                user.id.toString().toLowerCase().includes(document.getElementById('searchUser').value.toLowerCase()) ||
                user.username.toLowerCase().includes(document.getElementById('searchUser').value.toLowerCase()) ||
                user.role.toLowerCase().includes(document.getElementById('searchUser').value.toLowerCase()) ||
                (user.isActive ? 'activo' : 'inactivo').includes(document.getElementById('searchUser').value.toLowerCase())
            ).length;
            const totalPages = Math.ceil(totalFilteredRecords / parseInt(recordsPerPage));
            currentPage = Math.min(totalPages, currentPage + 1);
        }
        filterAndRenderUsers();
    }
}

function openModal(userData = null) {
    const modal = document.getElementById('createUserModal');
    const modalTitle = modal.querySelector('.modalusu-header h2');
    const saveButton = modal.querySelector('.btn_saveusu');

    if (userData) {
        modalTitle.textContent = 'Editar Usuario';
        fillModalWithUserData(userData);
        saveButton.setAttribute('data-id', userData.id);
    } else {
        modalTitle.textContent = 'Crear Usuario';
        document.getElementById('username').value = '';
        document.getElementById('contrasena').value = '';
        document.getElementById('confirmarContrasena').value = '';
        document.getElementById('tipo').value = 'ADMINISTRADOR';
        document.getElementById('estado').value = 'Activo';
        saveButton.removeAttribute('data-id');
    }

    modal.style.display = 'flex';
}

function fillModalWithUserData(userData) {
    document.getElementById('username').value = userData.username;
    document.getElementById('contrasena').value = '';
    document.getElementById('confirmarContrasena').value = '';
    document.getElementById('tipo').value = userData.role;
    document.getElementById('estado').value = userData.isActive ? 'Activo' : 'Inactivo';
}

async function handleSaveUser() {
    if (!confirm('¿Está seguro de que desea guardar los cambios?')) {
        return;
    }

    const username = document.getElementById('username').value;
    const password = document.getElementById('contrasena').value;
    const confirmPassword = document.getElementById('confirmarContrasena').value;
    const role = document.getElementById('tipo').value;
    const isActive = document.getElementById('estado').value === 'Activo';

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }

    const userData = { username, password, role, isActive };
    const userId = this.getAttribute('data-id');

    try {
        if (userId) {
            await updateUser({ id: userId, ...userData });
        } else {
            await createUser(userData);
        }
        closeModal();
        loadUsers();
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Error al guardar el usuario');
    }
}

function handleTableActions(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const userId = target.getAttribute('data-id');
    if (target.classList.contains('edit-btn')) {
        handleEdit(userId);
    } else if (target.classList.contains('delete-btn')) {
        handleDelete(userId);
    }
}

async function handleEdit(userId) {
    try {
        const user = await getUserById(parseInt(userId));
        if (user) {
            openModal(user);
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        alert('Error al obtener los datos del usuario');
    }
}

async function handleDelete(userId) {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
        try {
            await deleteUser(parseInt(userId));
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error al eliminar el usuario');
        }
    }
}

function closeModal() {
    document.getElementById('createUserModal').style.display = 'none';
}

// Expose necessary functions to window object for inline event handlers
window.closeModal = closeModal;
window.guardarUsuario = handleSaveUser;