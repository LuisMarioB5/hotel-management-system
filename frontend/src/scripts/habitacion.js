import { getAllRooms, getRoomById, updateRoom } from '../integrations/room.integration.js';

//----------------------------------------------------------------------------//
////ESTA PARTE ES PARA LA LISTA DE HABITACIONES la parte de M_HABITACIONES///
//----------------------------------------------------------------------------//

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
    const statusFilter = document.getElementById('statusFilter').value;
    let filteredRooms = allRooms.filter(room =>
        room.number.toString().toLowerCase().includes(searchTerm) ||
        room.floor.toLowerCase().includes(searchTerm) ||
        room.type.toLowerCase().includes(searchTerm) ||
        room.status.toLowerCase().includes(searchTerm) ||
        (room.isAvailable ? 'active' : 'inactive').includes(searchTerm)
    );

    if (statusFilter === 'active') {
        filteredRooms = filteredRooms.filter(room => room.isAvailable);
    } else if (statusFilter === 'inactive') {
        filteredRooms = filteredRooms.filter(room => !room.isAvailable);
    }

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
        const statusClass = getStatusClass(room.status);
        const row = `
            <tr>
                <td>${room.number}</td>
                <td>${room.details || ''}</td>
                <td>${room.floor}</td>
                <td>${room.type}</td>
                <td><span class="${statusClass}">${room.status}</span></td>
                <td>RD$${room.price}</td>
                <td><span class="status ${room.isAvailable ? 'active' : 'inactive'}">${room.isAvailable ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <label class="status-toggle" title="${room.isAvailable ? 'Desactivar' : 'Activar'}">
                        <input type="checkbox" class="status-toggle-input" data-id="${room.id}" ${room.isAvailable ? 'checked' : ''}>
                        <span class="status-toggle-slider"></span>
                    </label>
                    <button class="edit-btn" data-id="${room.id}"><i class="fas fa-edit"></i></button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}
//Esto es para el color dependiendo el estado
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'disponible':
            return 'status-disponible';
        case 'reservada':
            return 'status-reservada';
        case 'ocupada':
            return 'status-ocupada';
        case 'fuera_de_servicio':
            return 'status-fuera_de_servicio';    
        case 'limpieza':
            return 'status-limpieza';
        default:
            return '';
    }
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
    document.querySelector('#roomTable').addEventListener('change', handleStatusToggle);
    document.querySelector('.btn_saveusu').addEventListener('click', handleSaveRoom);
    document.getElementById('searchUser').addEventListener('input', filterAndRenderRooms);
    document.getElementById('statusFilter').addEventListener('change', () => {
        currentPage = 1;
        filterAndRenderRooms();
    });
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

async function handleStatusToggle(event) {
    if (!event.target.classList.contains('status-toggle-input')) return;

    const checkbox = event.target;
    const id = checkbox.getAttribute('data-id');
    const newState = checkbox.checked;

    checkbox.disabled = true;
    const result = await updateRoom({ id, isAvailable: newState });
    checkbox.disabled = false;

    if (result) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: newState ? 'Habitación activada' : 'Habitación desactivada',
            showConfirmButton: false,
            timer: 1800,
            timerProgressBar: true,
        });
        loadRooms();
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

    const disponibilidad = document.getElementById('Disponibilidad').value;
    const estado = document.getElementById('estado').value;
    const numero = document.getElementById('numero').value;
    const detalle = document.getElementById('detalle').value;
    const piso = document.getElementById('piso').value;
    const categoria = document.getElementById('categoria').value;
    const precio = document.getElementById('precio').value;

    // Validación de campos vacíos
    if (!numero || !detalle || !piso || !categoria || !precio) {
        Swal.fire({
            icon: 'error',
            title: 'Campos vacíos',
            text: 'Por favor, complete todos los campos obligatorios.',
        });
        return; // Evitar guardar los datos
    }

    // Verificación de consistencia entre disponibilidad y estado
    if (disponibilidad === 'FUERA_DE_SERVICIO' && estado === 'Activo') {
        Swal.fire({
            icon: 'error',
            title: 'Error en disponibilidad',
            text: 'Si la disponibilidad es "FUERA DE SERVICIO", el estado debe ser "Inactivo".',
        });
        return; // Evitar guardar los datos
    }
    if (disponibilidad === 'LIMPIEZA' && estado === 'Activo') {
        Swal.fire({
            icon: 'error',
            title: 'Error en disponibilidad',
            text: 'Si la habitacion esta en "LIMPIEZA", el estado debe ser "Inactivo".',
        });
        return; // Evitar guardar los datos
    }

    // Validación de que el precio no puede ser letras
    if (!/^\d+(\.\d{1,2})?$/.test(precio)) {
        Swal.fire({
            icon: 'error',
            title: 'Precio inválido',
            text: 'Por favor, ingrese un precio válido (ejemplo: 10.99).',
        });
        return;
    }

    const confirmacion = await Swal.fire({
        title: 'Confirmación',
        text: '¿Está seguro de que desea guardar los cambios?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) {
        return; // Si el usuario cancela, no guardar los cambios
    }

    const roomId = this.getAttribute('data-id');
    const updatedRoomData = {
        id: parseInt(roomId),
        number: parseInt(numero),
        details: detalle,
        floor: piso,
        type: categoria,
        status: disponibilidad,
        price: parseFloat(precio),
        isAvailable: estado === 'Activo'
    };

    try {
        await updateRoom(updatedRoomData);
        closeModal();
        loadRooms();
    } catch (error) {
        console.error('Error updating room:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al actualizar la habitación',
        });
    }
}


function closeModal() {
    document.getElementById('createUserModal').style.display = 'none';
}

// Expose necessary functions to window object for inline event handlers
window.closeModal = closeModal;
window.guardarHabitacion = handleSaveRoom;

//----------------------------------------------------------------------------//
             ////ESTA PARTE ES PARA LA PARTE DEL DASHBOARD///
//----------------------------------------------------------------------------//

async function updateRoomCounts() {
    try {
        const rooms = await getAllRooms();

        // Calcular los conteos por estado sin importar disponibilidad u otros filtros
        const totalRooms = rooms.length;
        const availableRooms = rooms.filter(room => room.status.toLowerCase() === 'disponible').length;
        const occupiedRooms = rooms.filter(room => room.status.toLowerCase() === 'ocupada').length;
        const noserviceRooms = rooms.filter(room => room.status.toLowerCase() === 'fuera_de_servicio').length;
        const cleaningRooms = rooms.filter(room => room.status.toLowerCase() === 'limpieza').length;

        // Actualizar los elementos del DOM en dashboard.html
        document.getElementById('total-rooms').textContent = totalRooms;
        document.getElementById('available-rooms').textContent = availableRooms;
        document.getElementById('occupied-rooms').textContent = occupiedRooms;
        document.getElementById('noservice-rooms').textContent = noserviceRooms;
        document.getElementById('cleaning-rooms').textContent = cleaningRooms;
    } catch (error) {
        console.error('Error al actualizar los conteos de habitaciones:', error);
    }
}

// Llama a la función para actualizar los conteos al cargar la página
document.addEventListener('DOMContentLoaded', updateRoomCounts);


//----------------------------------------------------------------------------//
             ////ESTA PARTE ES PARA LA PAGINA  DE HABITACION RECEPCION///
//----------------------------------------------------------------------------//


export function initializeAllRooms() {
    const roomsGrid = document.querySelector('.rooms-grid');
    const floorSelector = document.querySelector('.floor-selector');

    async function loadAllRooms(floor = 'Todos') {
        try {
            const allRooms = await getAllRooms();
            const roomsToShow = allRooms.filter(room =>
                ['disponible', 'limpieza', 'ocupada'].includes(room.status.toLowerCase()) &&
                (floor === 'Todos' || room.floor.toUpperCase() === floor)
            );
            renderAllRooms(roomsToShow);
        } catch (error) {
            console.error('Error loading rooms:', error);
        }
    }

    function getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'disponible': return 'disponible';
            case 'limpieza': return 'limpieza';
            case 'ocupada': return 'ocupado';
            default: return '';
        }
    }

    function renderAllRooms(rooms) {
        roomsGrid.innerHTML = '';
        rooms.forEach(room => {
            const statusClass = getStatusClass(room.status);
            const roomCard = `
                <div class="room-card ${statusClass}">
                    <div class="room-header">
                        <span class="room-number">NRO: ${room.number}</span>
                        <i class="fas fa-${statusClass === 'limpieza' ? 'broom' : statusClass === 'ocupado' ? 'user-check' : 'bed'} room-icon"></i>
                    </div>
                    <div class="room-category">CATEGORIA: ${room.type}</div>
                    <div class="room-status ${statusClass}" data-id="${room.id}" onclick="redirectToPage('${statusClass}', '${room.id}', '${room.number}', '${room.type}', '${room.floor}', '${encodeURIComponent(room.details || '')}','${room.price}')">
                        ${room.status.toUpperCase()}
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
            roomsGrid.insertAdjacentHTML('beforeend', roomCard);
        });
    }

    window.redirectToPage = function(status, id, number, type, floor, details,price) {
        switch (status) {
            case 'disponible':
                window.location.href = `../pages/G_registroReserva.html?RoomId=${id}&number=${number}&type=${type}&floor=${floor}&details=${details}&price=${price}`;
                break;
            case 'ocupado':
                window.location.href = '../pages/G_salida.html';
                break;
            case 'limpieza':
                window.location.href = '../pages/M_limpieza.html';
                break;
        }
    };

    floorSelector.addEventListener('change', () => loadAllRooms(floorSelector.value));
    loadAllRooms();
}