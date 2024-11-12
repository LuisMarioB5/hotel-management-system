import { getAllUsers, createUser, updateUser, deleteUser, getUserByUsername, getUserById } from '../integrations/user.integration.js';

let allUsers = []; // Variable para almacenar todos los usuarios

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setupEventListeners();
});

async function loadUsers() {
    try {
        allUsers = await getAllUsers();
        renderUsers(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
    }
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
                <td><span class="status ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="edit-btn" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${user.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

function setupEventListeners() {
    const createButton = document.querySelector('.create-button');
    createButton.addEventListener('click', () => openModal());

    const saveButton = document.querySelector('.btn_saveusu');
    saveButton.addEventListener('click', handleSaveUser);

    document.querySelector('#userTable').addEventListener('click', handleTableActions);

    // Agregar evento para la búsqueda en tiempo real
    const searchInput = document.getElementById('searchUser');
    searchInput.addEventListener('input', handleSearch);
}

async function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    if (searchTerm.length === 0) {
        renderUsers(allUsers);
        return;
    }

    let filteredUsers = allUsers.filter(user => 
        user.id.toString().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm)
    );

    // Si no se encuentra ningún usuario, intentamos buscar por ID o username exacto
    if (filteredUsers.length === 0) {
        try {
            const userById = await getUserById(parseInt(searchTerm));
            if (userById) {
                filteredUsers = [userById];
            } else {
                const userByUsername = await getUserByUsername(searchTerm);
                if (userByUsername) {
                    filteredUsers = [userByUsername];
                }
            }
        } catch (error) {
            console.error('Error searching for user:', error);
        }
    }

    renderUsers(filteredUsers);
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
        document.getElementById('tipo').value = 'Administrador';
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