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
    const username = document.getElementById('username').value;
    const password = document.getElementById('contrasena').value;
    const confirmPassword = document.getElementById('confirmarContrasena').value;
    const role = document.getElementById('tipo').value;
    const isActive = document.getElementById('estado').value === 'Activo';

    // Validaciones
    if (!username || !password || !confirmPassword || !role) {
        showAlert('error', 'Error', 'Por favor, complete todos los campos requeridos.', 1500);
        return;
    }

    if (password !== confirmPassword) {
        showAlert('error', 'Error', 'Las contraseñas no coinciden.', 1500);
        return;
    }

    if (password.length < 6) {
        showAlert('warning', 'Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.', 1500);
        return;
    }

    const userData = { username, password, role, isActive };
    const userId = this.getAttribute('data-id');

    try {
        const action = userId ? updateUser : createUser;
        await action(userId ? { id: userId, ...userData } : userData);

        closeModal();
        loadUsers();
        showAlert('success', 'Éxito', userId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.', 1500);
    } catch (error) {
        console.error('Error saving user:', error);
        showAlert('error', 'Error', 'Hubo un problema al guardar el usuario.', 1500);
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
        showAlert('error', 'Error', 'Error al obtener los datos del usuario', 1500);
    }
}

async function handleDelete(userId) {
    // Muestra la alerta de confirmación y espera la respuesta del usuario
    const result = await Swal.fire({
        icon: 'warning',
        title: 'Confirmación',
        text: '¿Está seguro de que desea eliminar este usuario?',
        showConfirmButton: true,
        confirmButtonText: 'Sí, eliminar',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        allowOutsideClick: true,  // No permitir que se cierre al hacer clic fuera
        backdrop: true,
        heightAuto: false,
        customClass: {
            container: 'swal-container',
        },
    });

    // Si el usuario confirma, se procede con la eliminación
    if (result.isConfirmed) {
        try {
            // Espera a la confirmación antes de proceder
            await deleteUser(parseInt(userId));
            loadUsers();
            // Después de eliminar, muestra la alerta de éxito
            showAlert('success', 'Éxito', 'Usuario eliminado correctamente.', 1500);
        } catch (error) {
            console.error('Error deleting user:', error);
            showAlert('error', 'Error', 'Error al eliminar el usuario', 1500);
        }
    }
}

// Función para mostrar las alertas con SweetAlert2
function showAlert(icon, title, text, timer = 1500, showConfirmButton = false) {
    return Swal.fire({
        icon,
        title,
        text,
        showConfirmButton,
        showCancelButton: showConfirmButton,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar',
        allowOutsideClick: true,
        backdrop: true,
        heightAuto: false,
        customClass: {
            container: 'swal-container',
        },
        timer: timer,  // Cierra la alerta después del tiempo especificado
        timerProgressBar: true,  // Muestra la barra de progreso
    });
}

function closeModal() {
    document.getElementById('createUserModal').style.display = 'none';
}

// Expose necessary functions to window object for inline event handlers
window.closeModal = closeModal;
window.guardarUsuario = handleSaveUser;

//----------------------------------------------------------------------------//
             ////ESTA PARTE ES PARA LOS 3 ULTIMOS USUARIOS DEL DASHBOARD  ///
//----------------------------------------------------------------------------//

export async function loadLatestUsers() {
    try {
        // Obtener todos los usuarios
        const users = await getAllUsers();

        // Ordenar los usuarios por ID de forma descendente y obtener los últimos 3
        const latestUsers = users.sort((a, b) => b.id - a.id).slice(0, 3);

        // Insertar los últimos 3 usuarios en el HTML
        const latestUsersContainer = document.querySelector('.latest-section .latest-content');
        latestUsersContainer.innerHTML = ''; // Limpiar contenido anterior

        latestUsers.forEach(user => {
            const userElement = document.createElement('div');
            userElement.classList.add('item');
            userElement.innerHTML = `
                <div class="item-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="item-info">
                    <div class="item-title">${user.username}</div>
                    <div class="item-subtitle">${user.role}</div>
                </div>
            `;
            latestUsersContainer.appendChild(userElement);
        });
    } catch (error) {
        console.error('Error al cargar los últimos usuarios:', error);
    }
}

async function updateUsersCounts() {
    try {
        const users = await getAllUsers();  // Obtener todos los usuarios
        const totalUsers = users.length;    // Contar el total de usuarios

        // Actualizar el DOM en dashboard.html
        document.getElementById('total-Users').textContent = totalUsers;
    } catch (error) {
        console.error('Error al actualizar el conteo de usuarios:', error);
    }
}

// Llamar a la función para actualizar el conteo de usuarios al cargar la página
document.addEventListener('DOMContentLoaded', updateUsersCounts);