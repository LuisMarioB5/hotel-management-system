import { getAllRooms, getRoomById, updateRoom } from '../integrations/room.integration.js';

let allRooms = [];
let currentPage = 1;
let recordsPerPage = 'All';

document.addEventListener('DOMContentLoaded', () => {
    loadRooms();
    setupEventListeners();
});

async function loadRooms() {
    try {
        allRooms = await getAllRooms();
        filterAndRenderRooms();
    } catch (error) {
        console.error('Error loading rooms:', error);
    }
}

function filterAndRenderRooms() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    let filteredRooms = allRooms.filter(room => 
        room.number.toString().toLowerCase().includes(searchTerm) ||
        room.floor.toLowerCase().includes(searchTerm) ||
        room.type.toLowerCase().includes(searchTerm) ||
        room.status.toLowerCase().includes(searchTerm) ||
        (room.isAvailable ? 'active' : 'inactive').includes(searchTerm)
    );

    if (recordsPerPage !== 'All') {
        const startIndex = (currentPage - 1) * parseInt(recordsPerPage);
        const endIndex = startIndex + parseInt(recordsPerPage);
        filteredRooms = filteredRooms.slice(startIndex, endIndex);
    }

    renderRooms(filteredRooms);
    updatePaginationInfo(filteredRooms.length);
}

function renderRooms(rooms) {
    const tableBody = document.querySelector('#roomTable tbody');
    tableBody.innerHTML = '';

    rooms.forEach(room => {
        const row = `
            <tr>
                <td>${room.number}</td>
                <td>${room.details || ''}</td>
                <td>${room.floor}</td>
                <td>${room.type}</td>
                <td>${room.status}</td>
                <td>RD$${room.price}</td>
                <td><span class="status ${room.isAvailable ? 'active' : 'inactive'}">${room.isAvailable ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="edit-btn" data-id="${room.id}"><i class="fas fa-edit"></i></button>
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
        paginationButtons.style.display = 'block';
    }
}

function setupEventListeners() {
    document.querySelector('#roomTable').addEventListener('click', handleTableActions);
    document.querySelector('.btn_saveusu').addEventListener('click', handleSaveRoom);
    document.getElementById('searchUser').addEventListener('input', filterAndRenderRooms);
    document.getElementById('recordsPerPage').addEventListener('change', handleRecordsPerPageChange);
    document.querySelector('.pagination-buttons').addEventListener('click', handlePaginationClick);
}

function handleRecordsPerPageChange(event) {
    recordsPerPage = event.target.value;
    currentPage = 1;
    filterAndRenderRooms();
}

function handlePaginationClick(event) {
    if (event.target.classList.contains('pagination-btn')) {
        if (event.target.textContent === '<') {
            currentPage = Math.max(1, currentPage - 1);
        } else if (event.target.textContent === '>') {
            const totalPages = Math.ceil(allRooms.length / parseInt(recordsPerPage));
            currentPage = Math.min(totalPages, currentPage + 1);
        }
        filterAndRenderRooms();
    }
}

function handleTableActions(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const roomId = target.getAttribute('data-id');
    if (target.classList.contains('edit-btn')) {
        handleEdit(roomId);
    }
}

async function handleEdit(roomId) {
    try {
        const room = await getRoomById(parseInt(roomId));
        if (room) {
            openModal(room);
        } else {
            throw new Error('Room not found');
        }
    } catch (error) {
        console.error('Error fetching room data:', error);
        alert('Error al obtener los datos de la habitación');
    }
}

function openModal(roomData) {
    const modal = document.getElementById('createUserModal');
    fillModalWithRoomData(roomData);
    modal.style.display = 'flex';
}

function fillModalWithRoomData(roomData) {
    document.getElementById('numero').value = roomData.number;
    document.getElementById('detalle').value = roomData.details || '';
    document.getElementById('piso').value = roomData.floor;
    document.getElementById('categoria').value = roomData.type;
    document.getElementById('Disponibilidad').value = roomData.status;
    document.getElementById('precio').value = roomData.price;
    document.getElementById('estado').value = roomData.isAvailable ? 'Activo' : 'Inactivo';
    document.querySelector('.btn_saveusu').setAttribute('data-id', roomData.id);
}

async function handleSaveRoom() {
    if (!confirm('¿Está seguro de que desea guardar los cambios?')) {
        return;
    }

    const roomId = this.getAttribute('data-id');
    const updatedRoomData = {
        id: parseInt(roomId),
        number: parseInt(document.getElementById('numero').value),
        details: document.getElementById('detalle').value,
        floor: document.getElementById('piso').value,
        type: document.getElementById('categoria').value,
        status: document.getElementById('Disponibilidad').value,
        price: parseFloat(document.getElementById('precio').value),
        isAvailable: document.getElementById('estado').value === 'Activo'
    };

    try {
        await updateRoom(updatedRoomData);
        closeModal();
        loadRooms();
    } catch (error) {
        console.error('Error updating room:', error);
        alert('Error al actualizar la habitación');
    }
}

function closeModal() {
    document.getElementById('createUserModal').style.display = 'none';
}

// Expose necessary functions to window object for inline event handlers
window.closeModal = closeModal;
window.guardarHabitacion = handleSaveRoom;