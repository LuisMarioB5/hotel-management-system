// booking.js
import { createCustomer, getCustomerByDocumentNumber, updateCustomer } from '../integrations/customer.integration.js';
import { createBooking, confirmBooking, cancelBooking, checkInBooking,getAllBookings } from '../integrations/booking.integration.js';
import { updateRoom,getAllRooms,getRoomById } from '../integrations/room.integration.js';

document.addEventListener('DOMContentLoaded', () => {
    const registrarBtn = document.getElementById('registrarBtn');
    if (registrarBtn) {
        registrarBtn.addEventListener('click', handleBookingProcess);
    }
});

async function handleBookingProcess() {
    if (!validateForm()) {
        return;
    }

    const customerData = getCustomerData();
    const bookingData = getBookingData();

    try {
        const customer = await handleCustomer(customerData);
        if (!customer) {
            return;
        }

        const booking = await createBooking({
            customerId: customer.id,
            roomId: bookingData.roomId,
            checkInDate: bookingData.checkInDate,
            checkOutDate: bookingData.checkOutDate,
            details: bookingData.details
        });

        await handleBookingConfirmation(booking);
    } catch (error) {
        console.error('Error en el proceso de reserva:', error);
        showAlert('error', 'Error', 'Hubo un problema al procesar la reserva.');
    }
}

function validateForm() {
    let isValid = true;

    // Expresiones regulares para validaciones
    const docRegex = /^[a-zA-Z0-9]+$/; // Documento puede ser letras y números
    const nameRegex = /^[a-zA-Z\s]+$/; // Solo letras y espacios
    const phoneRegex = /^\d+$/; // Solo números
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;

    // Validar número de documento
    const nroDocumento = document.getElementById('nroDocumento').value.trim();
    if (!nroDocumento || !docRegex.test(nroDocumento)) {
        showFieldError('nroDocumento', 'El número de documento solo debe contener letras y números.');
        isValid = false;
    } else {
        clearFieldError('nroDocumento');
    }

    // Validar nombre
    const nombre = document.getElementById('nombre').value.trim();
    if (!nombre || !nameRegex.test(nombre)) {
        showFieldError('nombre', 'El nombre solo debe contener letras y espacios.');
        isValid = false;
    } else {
        clearFieldError('nombre');
    }

    // Validar apellido
    const apellido = document.getElementById('apellido').value.trim();
    if (!apellido || !nameRegex.test(apellido)) {
        showFieldError('apellido', 'El apellido solo debe contener letras y espacios.');
        isValid = false;
    } else {
        clearFieldError('apellido');
    }

    // Validar teléfono
    const telefono = document.getElementById('telefono').value.trim();
    if (!telefono || !phoneRegex.test(telefono)) {
        showFieldError('telefono', 'El teléfono solo debe contener números.');
        isValid = false;
    } else {
        clearFieldError('telefono');
    }

    // Validar correo
    const correo = document.getElementById('correo').value.trim();
    if (!correo || !emailRegex.test(correo)) {
        showFieldError('correo', 'Por favor, ingrese un correo electrónico válido.');
        isValid = false;
    } else {
        clearFieldError('correo');
    }

    // Validar fecha de entrada
    const fechaEntrada = document.getElementById('fechaEntrada').value.trim();
    if (!fechaEntrada) {
        showFieldError('fechaEntrada', 'La fecha de entrada es requerida.');
        isValid = false;
    } else {
        clearFieldError('fechaEntrada');
    }

    // Validar fecha de salida
    const fechaSalida = document.getElementById('fechaSalida').value.trim();
    if (!fechaSalida) {
        showFieldError('fechaSalida', 'La fecha de salida es requerida.');
        isValid = false;
    } else if (new Date(fechaSalida) <= new Date(fechaEntrada)) {
        showFieldError('fechaSalida', 'La fecha de salida debe ser posterior a la fecha de entrada.');
        isValid = false;
    } else {
        clearFieldError('fechaSalida');
    }

    // Validar precio
    const precio = document.getElementById('precio').value.trim();
    if (!precio || isNaN(precio) || parseFloat(precio) <= 0) {
        showFieldError('precio', 'El precio debe ser un número mayor que cero.');
        isValid = false;
    } else {
        clearFieldError('precio');
    }

    if (!isValid) {
        showAlert('error', 'Error de validación', 'Por favor, corrija los campos marcados en rojo.');
    }

    return isValid;
}
function showFieldError(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    field.classList.add('is-invalid');
    
    // Remover mensaje de error anterior si existe
    clearFieldError(fieldId);

    // Crear nuevo mensaje de error con estilo
    const newErrorDiv = document.createElement('div');
    newErrorDiv.className = 'error-message';
    newErrorDiv.textContent = errorMessage;
    newErrorDiv.style.cssText = `
        color: #dc3545;
        font-size: 0.875em;
        margin-top: 0.25rem;
        margin-bottom: 0.5rem;
    `;

    // Agregar borde rojo al input
    field.style.borderColor = '#dc3545';
    field.style.boxShadow = '0 0 0 0.25rem rgba(220, 53, 69, 0.25)';

    // Insertar mensaje de error después del campo
    field.parentNode.insertBefore(newErrorDiv, field.nextSibling);

    // Configurar temporizador para eliminar el mensaje después de 3 segundos
    setTimeout(() => {
        clearFieldError(fieldId);
    }, 3000);
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.remove('is-invalid');
    
    // Remover mensaje de error si existe
    const errorDiv = field.parentNode.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }

    // Restaurar estilo original del input
    field.style.borderColor = '';
    field.style.boxShadow = '';
}
function clearAllErrors() {
    const fields = ['nroDocumento', 'nombre', 'apellido', 'telefono', 'correo', 'fechaEntrada', 'fechaSalida', 'precio'];
    fields.forEach(fieldId => clearFieldError(fieldId));
}

// También agregar estos estilos al head del documento
const style = document.createElement('style');
style.textContent = `
    .is-invalid {
        border-color: #dc3545 !important;
        padding-right: calc(1.5em + 0.75rem) !important;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right calc(0.375em + 0.1875rem) center;
        background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
    }

    .error-message {
        color: #dc3545;
        font-size: 0.875em;
        margin-top: 0.25rem;
        margin-bottom: 0.5rem;
        animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

function getCustomerData() {
    return {
        documentType: document.getElementById('tipo').value,
        documentNumber: document.getElementById('nroDocumento').value,
        name: document.getElementById('nombre').value,
        lastName: document.getElementById('apellido').value,
        email: document.getElementById('correo').value,
        phoneNumber: document.getElementById('telefono').value,
        gender: document.getElementById('sexo').value
    };
}

function getBookingData() {
    return {
        roomId: parseInt(document.getElementById('roomNumber').value),
        checkInDate: document.getElementById('fechaEntrada').value,
        checkOutDate: document.getElementById('fechaSalida').value,
        details: document.getElementById('observacion').value
    };
}

async function handleCustomer(customerData) {
    let customer = await getCustomerByDocumentNumber(customerData.documentNumber);
    
    if (customer) {
        // Actualizar cliente existente
        customer = await updateCustomer({
            id: customer.id,
            ...customerData
        });
    } else {
        // Crear nuevo cliente
        customer = await createCustomer(customerData);
    }

    return customer;
}

async function handleBookingConfirmation(booking) {
    const result = await Swal.fire({
        title: 'Reserva Pendiente',
        text: '¿Desea confirmar la reserva?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'No',
        allowOutsideClick: false
    });

    if (result.isConfirmed) {
        await confirmBooking(booking.id);
        await handleCheckIn(booking);
    } else {
        showAlert('info', 'Reserva Pendiente', 'La reserva se ha guardado como pendiente.', 1500);
        setTimeout(() => {
            window.location.href = "../pages/G_recepcion.html";
        }, 1500);
    }
}

async function handleCheckIn(booking) {
    const result = await Swal.fire({
        title: 'Reserva confirmada',
        text: '¿Desea iniciar el hospedaje?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'No',
        allowOutsideClick: false
    });

    if (result.isConfirmed) {
        // Redirigir a la página de check-in con los datos de la reserva
        const params = new URLSearchParams({
            bookingId: booking.id,
            roomNumber: booking.room.number,
            customerName: `${booking.customer.name} ${booking.customer.lastName}`,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate
        });
        window.location.href = `../pages/G_check_in.html?${params.toString()}`;
    } else {
        showAlert('success', 'Reserva Confirmada', 'La reserva ha sido confirmada sin iniciar el hospedaje.', 1500);
        setTimeout(() => {
            window.location.href = "../pages/G_recepcion.html";
        }, 1500);
    }
}

function showAlert(icon, title, text, timer = null) {
    Swal.fire({
        icon,
        title,
        text,
        timer,
        timerProgressBar: true,
        allowOutsideClick: false
    });
}

// Exportar funciones para uso en G_check_in.html
window.cancelBooking = async function(bookingId) {
    try {
        await cancelBooking(bookingId);
        showAlert('success', 'Reserva Cancelada', 'La reserva ha sido cancelada exitosamente.', 1500);
        setTimeout(() => {
            window.location.href = "../pages/G_recepcion.html";
        }, 1500);
    } catch (error) {
        console.error('Error al cancelar la reserva:', error);
        showAlert('error', 'Error', 'Hubo un problema al cancelar la reserva.');
    }
};

window.confirmCheckIn = async function(bookingId, roomId) {
    try {
        await checkInBooking(bookingId);
        await updateRoom({ id: roomId, status: 'OCUPADA', isAvailable: false });
        showAlert('success', 'Check-in Completado', 'El hospedaje ha iniciado exitosamente.', 1500);
        setTimeout(() => {
            window.location.href = "../pages/G_recepcion.html";
        }, 1500);
    } catch (error) {
        console.error('Error al confirmar el check-in:', error);
        showAlert('error', 'Error', 'Hubo un problema al iniciar el hospedaje.');
    }
};

//----------------------------------------------------------------------------//
             ////ESTA PARTE ES PARA LA PAGINA DEL DASHBOARD///
//----------------------------------------------------------------------------//


// Función para actualizar el conteo de reservas confirmadas
async function updateBookingCounts() {
    try {
        const bookings = await getAllBookings(); // Obtener todas las reservas
        const confirmedBookings = bookings.filter(booking => booking.status === 'CONFIRMADA'); // Filtrar las confirmadas
        const totalBookings = confirmedBookings.length; // Contar las reservas confirmadas

        // Actualizar el DOM en dashboard.html
        document.getElementById('reserved-rooms').textContent = totalBookings;
    } catch (error) {
        console.error('Error al actualizar el conteo de reservas:', error);
    }
}

// Función para cargar las últimas tres reservas confirmadas
async function loadLatestBookings() {
    try {
        const bookings = await getAllBookings(); // Obtener todas las reservas

        // Filtrar las reservas confirmadas y ordenarlas por fecha de check-in descendente
        const confirmedBookings = bookings
            .filter(booking => booking.status === 'CONFIRMADA')
            .sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate))
            .slice(0, 3); // Obtener las últimas tres

        // Insertar las últimas 3 reservas confirmadas en el HTML
        const latestBookingsContainer = document.querySelector('.latest-section .latest-content.reservas');
        latestBookingsContainer.innerHTML = ''; // Limpiar contenido anterior

        confirmedBookings.forEach(booking => {
            const bookingElement = document.createElement('div');
            bookingElement.classList.add('item');
            bookingElement.innerHTML = `
                <div class="item-avatar">
                    <i class="fas fa-bed"></i>
                </div>
                <div class="item-info">
                    <div class="item-title">Habitación ${booking.room.number} - ${booking.room.type}</div>
                    <div class="item-subtitle"><span>Check-in:</span> ${new Date(booking.checkInDate).toLocaleDateString()}</div>
                </div>
            `;
            latestBookingsContainer.appendChild(bookingElement);
        });
    } catch (error) {
        console.error('Error al cargar las últimas reservas:', error);
    }
}

// Llamar a las funciones al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    updateBookingCounts(); // Para mostrar el total de reservas confirmadas
    loadLatestBookings(); // Para mostrar las últimas 3 reservas confirmadas
});

//----------------------------------------------------------------------------//
             ////ESTA PARTE ES PARA LA PAGINA DE RESERVACIONES///
//----------------------------------------------------------------------------//

export function initializeRoomReservations() {
    const roomsGrid = document.querySelector('.rooms-grid');
    const floorSelector = document.querySelector('.floor-selector');
    let selectedBookingId = null;
    let selectedRoomNumber = null;

    async function loadReservations(floor = 'Todos') {
        try {
            const allReservations = await getAllBookings();
            console.log('All reservations:', allReservations); // Log all reservations for debugging

            const filteredReservations = allReservations.filter(reservation => {
                const status = reservation.status?.toLowerCase() || '';
                return ['pendiente', 'confirmada'].includes(status);
            });

            const reservationsWithRooms = await Promise.all(
                filteredReservations.map(async (reservation) => {
                    console.log('Processing reservation:', reservation); // Log each reservation being processed

                    // Check for roomId in different possible locations
                    const roomId = reservation.roomId || reservation.room?.id || reservation.room;

                    if (!roomId) {
                        console.warn(`Reserva con ID ${reservation.id} no tiene roomId válido.`);
                        return { ...reservation, roomDetails: null };
                    }

                    try {
                        const room = await getRoomById(parseInt(roomId));
                        console.log(`Room details for reservation ${reservation.id}:`, room); // Log room details
                        return { ...reservation, roomDetails: room };
                    } catch (error) {
                        console.error(`Error al obtener la habitación para reserva ID ${reservation.id}:`, error);
                        return { ...reservation, roomDetails: null };
                    }
                })
            );

            const reservationsToRender = reservationsWithRooms.filter(reservation =>
                floor === 'Todos' || reservation.roomDetails?.floor?.toUpperCase() === floor
            );

            console.log('Reservations to render:', reservationsToRender); // Log reservations being rendered
            renderReservations(reservationsToRender);
        } catch (error) {
            console.error('Error al cargar las reservas:', error);
            showAlert('error', 'Error', 'Hubo un problema al cargar las reservas.', 1500);
        }
    }

    function renderReservations(reservations) {
        roomsGrid.innerHTML = '';
        reservations.forEach(reservation => {
            const { roomDetails, status } = reservation;
            const statusClass = (status || '').toLowerCase() === 'confirmada' ? 'reservado' : 'confirmar';
            const statusText = (status || '').toLowerCase() === 'confirmada' ? 'RESERVADO' : 'CONFIRMAR RESERVA';

            const roomCard = `
                <div class="room-card ${statusClass}">
                    <div class="room-header">
                        <span class="room-number">NRO: ${roomDetails?.number || 'No disponible'}</span>
                        <i class="fas ${statusClass === 'reservado' ? 'fa-calendar-check' : 'fa-check-circle'} room-icon"></i>
                    </div>
                    <div class="room-category">
                        CATEGORÍA: ${roomDetails?.type || 'Sin categoría'}
                    </div>
                    <div class="room-status ${statusClass}" data-id="${reservation.id}" data-number="${roomDetails?.number}">
                        ${statusText}
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
            roomsGrid.insertAdjacentHTML('beforeend', roomCard);
        });

        attachEventListeners();
    }

    function attachEventListeners() {
        document.querySelectorAll('.room-status.confirmar').forEach(btn => {
            btn.addEventListener('click', openActionModal);
        });

        document.querySelectorAll('.room-status.reservado').forEach(btn => {
            btn.addEventListener('click', redirectToCheckIn);
        });
    }
    async function openActionModal(event) {
        const roomElement = event.target.closest('.room-status');
        if (!roomElement) return;

        selectedBookingId = roomElement.getAttribute('data-id');
        selectedRoomNumber = roomElement.getAttribute('data-number');

        try {
            // Modal que pregunta si quiere confirmar o cancelar
            const result = await Swal.fire({
                icon: 'question',
                title: '¿Desea cancelar o confirmar la reserva?',
                showConfirmButton: true,
                confirmButtonText: 'Confirmar reserva',
                showCancelButton: true,
                showCloseButton: true,
                cancelButtonText: 'Cancelar reserva',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                allowOutsideClick: false,
                backdrop: true,
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
            if (result.dismiss === Swal.DismissReason.close) {
                console.log('El usuario cerró el modal usando la X');
                return; // Detenemos la ejecución si se cierra con la "X"
            }

            if (result.isConfirmed) {
                // Confirmar la reserva
                const confirmResult = await Swal.fire({
                    icon: 'question',
                    title: '¿Está seguro?',
                    text: `¿Está seguro de que desea confirmar la reserva de la habitación ${selectedRoomNumber}?`,
                    showConfirmButton: true,
                    confirmButtonText: 'Sí, confirmar',
                    showCancelButton: true,
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    allowOutsideClick: false,
                    heightAuto: false,
                    customClass: {
                        container: 'swal-container',
                    },
                });

                if (confirmResult.isConfirmed) {
                    confirmReservation();
                }
            } else {
                // Cancelar la reserva
                const cancelResult = await Swal.fire({
                    icon: 'question',
                    title: '¿Está seguro?',
                    text: `¿Está seguro de que desea cancelar la reserva de la habitación ${selectedRoomNumber}?`,
                    showConfirmButton: true,
                    confirmButtonText: 'Sí, cancelar',
                    showCancelButton: true,
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    allowOutsideClick: false,
                    heightAuto: false,
                    customClass: {
                        container: 'swal-container',
                    },
                });

                if (cancelResult.isConfirmed) {
                    cancelReservation();
                }
            }
        } catch (error) {
            console.error('Error abriendo el modal:', error);
        }
    }

    async function confirmReservation() {
        try {
            if (selectedBookingId) {
                await confirmBooking(selectedBookingId); // Verifica que confirmBooking esté implementada
                showAlert('success', `Reserva confirmada`, `La habitación ${selectedRoomNumber} ahora está reservada.`, 1500);
                loadReservations(floorSelector.value);
            }
        } catch (error) {
            console.error('Error confirming reservation:', error);
            showAlert('error', 'Error', 'Hubo un problema al confirmar la reserva.', 1500);
        }
    }

    async function cancelReservation() {
        try {
            if (selectedBookingId) {
                await cancelBooking(selectedBookingId); // Verifica que cancelBooking esté implementada
                showAlert('success', `Reserva cancelada`, `La reserva de la habitación ${selectedRoomNumber} ha sido cancelada.`, 1500);
                loadReservations(floorSelector.value);
            }
        } catch (error) {
            console.error('Error canceling reservation:', error);
            showAlert('error', 'Error', 'Hubo un problema al cancelar la reserva.', 1500);
        }
    }

    function redirectToCheckIn(event) {
        const roomElement = event.target.closest('.room-status');
        const roomId = roomElement.getAttribute('data-id');
        window.location.href = `../pages/G_check-in.html?id=${roomId}`;
    }

    function showAlert(icon, title, text, timer = null) {
        Swal.fire({
            icon,
            title,
            text,
            allowOutsideClick: false,
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
            backdrop: true,
            timer: timer,
            timerProgressBar: timer !== null,
        });
    }

    floorSelector.addEventListener('change', () => loadReservations(floorSelector.value));

    loadReservations();
}


//----------------------------------------------------------------------------//
             ////ESTA PARTE ES PARA LA PAGINA DE RESERVAR///
//----------------------------------------------------------------------------//

export function initializeAvailableRoomReservations() {
    const roomsGrid = document.querySelector('.rooms-grid');
    const floorSelector = document.getElementById('room-number');
    const startDateInput = document.getElementById('fechaEntrada');
    const endDateInput = document.getElementById('fechaSalida');

    async function loadAvailableRoomsForReservation() {
        const floor = floorSelector.value;
        const startDate = parseDate(startDateInput.value);
        const endDate = parseDate(endDateInput.value);

        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);

        if (!startDate || !endDate) {
            console.error('Invalid date input');
            showAlertForReservation('error', 'Error', 'Por favor, seleccione fechas válidas.', 1500);
            return;
        }

        try {
            const [allRooms, allBookings] = await Promise.all([getAllRooms(), getAllBookings()]);
            console.log('All Rooms:', allRooms);
            console.log('All Bookings:', allBookings);

            // Filter confirmed bookings within the selected date range
            const relevantBookings = allBookings.filter(booking => 
                booking.status.toUpperCase() === 'CONFIRMADA' &&
                dateRangesOverlap(
                    startDate, endDate,
                    parseDate(booking.checkInDate), parseDate(booking.checkOutDate)
                )
            );

            console.log('Relevant Bookings:', relevantBookings);

            // Get IDs of rooms that are booked during the selected period
            const bookedRoomIds = new Set(relevantBookings.map(booking => booking.roomId));

            // Filter available rooms
            const availableRooms = allRooms.filter(room => {
                // Exclude rooms that are out of service
                if (room.status.toUpperCase() === 'FUERA_DE_SERVICIO') {
                    return false;
                }

                // Filter by floor if a specific floor is selected
                if (floor !== 'Todos' && room.floor.toUpperCase() !== floor) {
                    return false;
                }

                // Exclude rooms that are booked during the selected period
                return !bookedRoomIds.has(room.id);
            });

            console.log('Available Rooms:', availableRooms);
            renderAvailableRoomsForReservation(availableRooms);
        } catch (error) {
            console.error('Error loading available rooms:', error);
            showAlertForReservation('error', 'Error', 'Hubo un problema al cargar las habitaciones disponibles.', 1500);
        }
    }

    function dateRangesOverlap(start1, end1, start2, end2) {
        return start1 < end2 && end1 > start2;
    }

    function parseDate(dateString) {
        if (!dateString) return null;
        
        // Handle timestamp format (assuming it's in milliseconds)
        if (!isNaN(dateString)) {
            return new Date(parseInt(dateString));
        }
        
        // Handle 'yyyy/mm-dd' format
        const parts = dateString.split(/[/\-]/);
        if (parts.length === 3) {
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        
        // Fallback to default Date parsing
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    }

    function renderAvailableRoomsForReservation(rooms) {
        roomsGrid.innerHTML = '';
        if (rooms.length === 0) {
            roomsGrid.innerHTML = '<p>No hay habitaciones disponibles para las fechas seleccionadas.</p>';
            return;
        }
        rooms.forEach(room => {
            const roomCard = `
                <div class="room-card disponible">
                    <div class="room-header">
                        <span class="room-number">NRO: ${room.number}</span>
                        <i class="fas fa-bed room-icon"></i>
                    </div>
                    <div class="room-category">CATEGORIA: ${room.type}</div>
                    <div class="room-status disponible" onclick="redirectToNewReservation('${room.id}', '${room.number}', '${room.type}', '${room.floor}', '${encodeURIComponent(room.details || '')}', '${room.price}')">
                        RESERVAR
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
            roomsGrid.insertAdjacentHTML('beforeend', roomCard);
        });
    }

    function showAlertForReservation(icon, title, text, timer = null) {
        return Swal.fire({
            icon,
            title,
            text,
            timer: timer,
            timerProgressBar: timer !== null,
            showConfirmButton: !timer,
            showCancelButton: false,
            allowOutsideClick: false,
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });
    }

    // Event listeners
    floorSelector.addEventListener('change', loadAvailableRoomsForReservation);
    startDateInput.addEventListener('change', loadAvailableRoomsForReservation);
    endDateInput.addEventListener('change', loadAvailableRoomsForReservation);

    // Initial load
    loadAvailableRoomsForReservation();

    // Expose function to window object for the onclick event
    window.redirectToNewReservation = function(id, number, type, floor, details, price) {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        window.location.href = `../pages/G_registroReserva.html?id=${id}&number=${number}&type=${type}&floor=${floor}&details=${details}&price=${price}&startDate=${startDate}&endDate=${endDate}`;
    };
}

// ... (rest of the code remains unchanged)

// Initialize the appropriate function based on the current page
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
    if (currentPage.includes('G_reservas.html')) {
        initializeAvailableRoomReservations();
    } else if (currentPage.includes('G_registroReserva.html')) {
        initializeReservationForm();
    }
});