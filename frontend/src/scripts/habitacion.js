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

    const disponibilidad = document.getElementById('Disponibilidad').value;
    const estado = document.getElementById('estado').value;

    // Verificación de consistencia entre disponibilidad y estado
    if (disponibilidad === 'FUERA_DE_SERVICIO' && estado === 'Activo') {
        alert('Error: Si la disponibilidad es "FUERA DE SERVICIO", el estado debe ser "Inactivo".');
        return; // Evitar guardar los datos
    }
    if (disponibilidad === 'LIMPIEZA' && estado === 'Activo') {
        alert('Error: Si la habitacion esta en "LIMPIEZA", el estado debe ser "Inactivo".');
        return; // Evitar guardar los datos
    }
    
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
             ////ESTA PARTE ES PARA LA PAGINA DE HABITACION LIMPIEZA///
//----------------------------------------------------------------------------//
export function initializeCleaningRooms() {
    const roomsGrid = document.querySelector('.rooms-grid');
    const floorSelector = document.querySelector('.floor-selector');
    const limpiezaModal = document.getElementById('limpiezaModal');
    const confirmLimpiezaButton = document.getElementById('confirmarLimpieza');
    let selectedRoomId = null;

    // Cargar habitaciones en limpieza
    async function loadCleaningRooms(floor = 'Todos') {
        try {
            const allRooms = await getAllRooms();
            const roomsInCleaning = allRooms.filter(room => 
                room.status.toLowerCase() === 'limpieza' && 
                (floor === 'Todos' || room.floor.toUpperCase() === floor)
            );
            renderRoomsInCleaning(roomsInCleaning);
        } catch (error) {
            console.error('Error loading cleaning rooms:', error);
        }
    }

    // Renderizar habitaciones en el contenedor
    function renderRoomsInCleaning(rooms) {
        roomsGrid.innerHTML = '';
        rooms.forEach(room => {
            const roomCard = `
                <div class="room-card limpieza">
                    <div class="room-header">
                        <span class="room-number">NRO: ${room.number}</span>
                        <i class="fas fa-broom room-icon"></i>
                    </div>
                    <div class="room-category">CATEGORIA: ${room.type}</div>
                    <div class="room-status limpieza" data-id="${room.id}">
                        LIMPIEZA
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
            roomsGrid.insertAdjacentHTML('beforeend', roomCard);
        });

        // Asignar evento para abrir el modal en cada habitación
        document.querySelectorAll('.room-status.limpieza').forEach(btn => {
            btn.addEventListener('click', openLimpiezaModal);
        });
    }

    // Abrir el modal de confirmación de limpieza
    function openLimpiezaModal(event) {
        selectedRoomId = event.target.getAttribute('data-id');
        limpiezaModal.style.display = 'block';
    }

    // Confirmar limpieza y actualizar el estado
    async function confirmCleaning() {
        if (selectedRoomId) {
            try {
                await updateRoom({ id: selectedRoomId, status: 'DISPONIBLE',isAvailable: true });
                alert('Limpieza confirmada para la habitación');
                loadCleaningRooms(floorSelector.value); // Recargar habitaciones en limpieza
                closeModal();
            } catch (error) {
                console.error('Error updating room status:', error);
            }
        }
    }

    // Cerrar el modal
    function closeModal() {
        limpiezaModal.style.display = 'none';
        selectedRoomId = null;
    }

    // Filtrar habitaciones por piso al cambiar el selector
    floorSelector.addEventListener('change', () => loadCleaningRooms(floorSelector.value));
    confirmLimpiezaButton.addEventListener('click', confirmCleaning);
    document.getElementById('closeLimpiezaModal').addEventListener('click', closeModal);
    document.getElementById('cancelLimpieza').addEventListener('click', closeModal);

    // Cargar habitaciones en limpieza al inicio
    loadCleaningRooms();
}

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
                    <div class="room-status ${statusClass}" data-id="${room.id}" onclick="redirectToPage('${statusClass}', '${room.id}', '${room.number}', '${room.type}', '${room.floor}', '${encodeURIComponent(room.details || '')}')">
                        ${room.status.toUpperCase()}
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
            roomsGrid.insertAdjacentHTML('beforeend', roomCard);
        });
    }

    window.redirectToPage = function(status, id, number, type, floor, details) {
        switch (status) {
            case 'disponible':
                window.location.href = `../pages/G_registroReserva.html?id=${id}&number=${number}&type=${type}&floor=${floor}&details=${details}`;
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