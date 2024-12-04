import { createCustomer, getCustomerByDocumentNumber, updateCustomer } from '../integrations/customer.integration.js';
import { createBooking, confirmBooking, cancelBooking, checkInBooking, getAllBookings, updateBooking, getBookingById,checkOutBooking, desactiveBooking } from '../integrations/booking.integration.js';
import { updateRoom,getAllRooms,getRoomById } from '../integrations/room.integration.js';

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('RoomId');
    const roomNumber = urlParams.get('number');
    const roomDetails = decodeURIComponent(urlParams.get('details') || '');
    const roomCategory = urlParams.get('type');
    const roomFloor = urlParams.get('floor');
    const roomPrice = urlParams.get('price');
    const startDate = urlParams.get('startDate');
    const endDate = urlParams.get('endDate');

    if (roomId) {
        document.getElementById('roomId').value = roomId;
        document.getElementById('roomNumber').value = roomNumber;
        document.getElementById('roomDetails').value = roomDetails || 'No details available';
        document.getElementById('roomCategory').value = roomCategory;
        document.getElementById('roomFloor').value = roomFloor;
        if (roomPrice) {
            document.getElementById('precio').value = roomPrice;
            document.getElementById('roomPrice').value = roomPrice;
        }
    }

    const fechaEntrada = document.getElementById('fechaEntrada');
    const fechaSalida = document.getElementById('fechaSalida');

    // Set dates from URL parameters or default to today/tomorrow
    if (startDate) {
        fechaEntrada.value = startDate;
    } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        fechaEntrada.value = today.toISOString().split('T')[0];
    }

    if (endDate) {
        fechaSalida.value = endDate;
    } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        fechaSalida.value = tomorrow.toISOString().split('T')[0];
    }

    console.log('Room ID set:', document.getElementById('roomId').value);

    const registrarBtn = document.getElementById('registrarBtn');
    if (registrarBtn) {
        registrarBtn.addEventListener('click', handleBookingProcess);
    }
});

async function handleBookingProcess(event) {
    event.preventDefault();

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

        console.log('Creating booking with data:', bookingData);

        const bookingResult = await createBooking({
            customerId: customer.id,
            ...bookingData
        });

        if (bookingResult.error === 'OVERLAPPING_BOOKINGS') {
            console.log('Overlapping bookings:', bookingResult.overlappingBookings);
            await Swal.fire({
                icon: 'error',
                title: 'Reserva no disponible',
                html: `La habitación ya tiene reservas en las fechas seleccionadas.<br><br>
                       Fechas ocupadas:<br>
                       ${bookingResult.overlappingBookings.map(booking => 
                           `${new Date(booking.checkInDate).toLocaleDateString()} - ${new Date(booking.checkOutDate).toLocaleDateString()}`
                       ).join('<br>')}`,
                confirmButtonText: 'Entendido'
            });
        } else if (bookingResult) {
            await handleBookingConfirmation(bookingResult);
        } else {
            console.log('Booking creation returned unexpected result');
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema inesperado al crear la reserva. Por favor, intente nuevamente.',
                confirmButtonText: 'Entendido'
            });
        }
    } catch (error) {
        console.error('Error en el proceso de reserva:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al procesar la reserva.',
            confirmButtonText: 'Entendido'
        });
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
    const adelanto = parseFloat(document.getElementById('adelanto').value) || 0;
    const precio = parseFloat(document.getElementById('precio').value) || 0;
    const roomPrice = parseFloat(document.getElementById('roomPrice').value) || 0;
    const priceAdjustment = parseFloat(document.getElementById('priceAdjustment').value) || 0;
    const checkInDate = document.getElementById('fechaEntrada').value;
    const checkOutDate = document.getElementById('fechaSalida').value;
    const roomId = parseInt(document.getElementById('roomId').value, 10);

    const totalStayDays = calculateStayDays(checkInDate, checkOutDate);

    console.log('Booking data:', {
        checkInDate,
        checkOutDate,
        roomId,
        adelanto,
        precio,
        roomPrice,
        priceAdjustment,
        totalStayDays
    });

    if (isNaN(roomId)) {
        throw new Error('Invalid Room ID');
    }

    return {
        roomId: roomId,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        details: document.getElementById('observacion').value,
        isActive: true,
        status: 'PENDIENTE',
        cashAdvance: adelanto,
        totalCost: precio,
        stayCost: roomPrice * totalStayDays,
        priceAdjustment,
        totalStayDays: totalStayDays
    };
}

function calculateStayDays(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
    try {
        const confirmResult = await Swal.fire({
            title: 'Reserva Pendiente',
            text: '¿Desea confirmar la reserva?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'No',
            allowOutsideClick: false
        });

        if (confirmResult.isConfirmed) {
            // Confirmar la reserva directamente
            await confirmBooking(booking.id); // Cambia el estado a CONFIRMADA en el backend
            console.log(`Reserva confirmada para ID ${booking.id}`);

            // Mostrar un modal adicional para el hospedaje
            const hospedajeResult = await Swal.fire({
                title: 'Reserva Confirmada',
                text: '¿Desea iniciar el hospedaje?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, iniciar hospedaje',
                cancelButtonText: 'No, regresar a recepción',
                allowOutsideClick: false
            });

            if (hospedajeResult.isConfirmed) {
                window.location.href = "../pages/G_reservaciones.html"; // Redirigir a la gestión de hospedajes
            } else {
                window.location.href = "../pages/G_recepcion.html"; // Redirigir a la recepción
            }
        } else {
            await Swal.fire({
                icon: 'info',
                title: 'Reserva Pendiente',
                text: 'La reserva se mantendrá como pendiente.',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (error) {
        console.error('Error al confirmar la reserva:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al confirmar la reserva. Intente nuevamente.',
            confirmButtonText: 'Entendido'
        });
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
             ////ESTA PARTE ES PARA LA PAGINA DE G_RESERVACIONES///
//----------------------------------------------------------------------------//

export function initializeRoomReservations() {
    const roomsGrid = document.querySelector('.rooms-grid');
    const floorSelector = document.querySelector('.floor-selector');

    async function loadReservations(floor = 'Todos') {
        try {
            const allReservations = await getAllBookings();
            console.log('All reservations:', allReservations); // Log para depurar

            // Filtrar reservas por estado y evitar duplicados por habitación usando un Map
            const roomMap = new Map();
            allReservations.forEach(reservation => {
                const status = reservation.status?.toLowerCase() || '';
                if (['pendiente', 'confirmada'].includes(status)) {
                    const roomId = reservation.roomId || reservation.room?.id || reservation.room;
                    if (roomId && !roomMap.has(roomId)) {
                        roomMap.set(roomId, { roomId, reservation });
                    }
                }
            });

            // Obtener los detalles de las habitaciones
            const reservationsWithRooms = await Promise.all(
                Array.from(roomMap.values()).map(async ({ roomId, reservation }) => {
                    try {
                        const room = await getRoomById(parseInt(roomId));
                        return { ...reservation, roomDetails: room };
                    } catch (error) {
                        console.error(`Error al obtener la habitación para reserva ID ${reservation.id}:`, error);
                        return { ...reservation, roomDetails: null };
                    }
                })
            );

            // Filtrar habitaciones por piso
            const roomsToRender = reservationsWithRooms.filter(reservation =>
                floor === 'Todos' || reservation.roomDetails?.floor?.toUpperCase() === floor
            );

            console.log('Reservations to render:', roomsToRender); // Log para depurar
            renderReservations(roomsToRender);
        } catch (error) {
            console.error('Error al cargar las reservas:', error);
            showAlert('error', 'Error', 'Hubo un problema al cargar las reservas.', 1500);
        }
    }

    function renderReservations(reservations) {
        roomsGrid.innerHTML = ''; // Clear the container before rendering
        reservations.forEach(reservation => {
            const { roomDetails, status, id } = reservation;
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
                    <div class="room-status ${statusClass}" data-id="${id}" data-room-id="${roomDetails?.id}">
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
        document.querySelectorAll('.room-status.reservado').forEach(btn => {
            btn.addEventListener('click', redirectToCheckIn);
        });

        document.querySelectorAll('.room-status.confirmar').forEach(btn => {
            btn.addEventListener('click', openActionModal);
        });
    }

    async function openActionModal(event) {
        const roomElement = event.target.closest('.room-status');
        if (!roomElement) return;
    
        const bookingId  = roomElement.getAttribute('data-id');
        const roomNumber = roomElement.closest('.room-card').querySelector('.room-number').textContent.split(': ')[1];

        
    
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
                return; // Detenemos la ejecución si se cierra con la "X"
            }
    
            if (result.isConfirmed) {
                // Confirmar la reserva
                const confirmResult = await Swal.fire({
                    icon: 'question',
                    title: '¿Está seguro?',
                    text: `¿Está seguro de que desea confirmar la reserva de la habitación ${roomNumber}?`,
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
                    confirmReservation(bookingId,roomNumber);
                }
            } else {
                // Cancelar la reserva
                const cancelResult = await Swal.fire({
                    icon: 'question',
                    title: '¿Está seguro?',
                    text: `¿Está seguro de que desea cancelar la reserva de la habitación ${roomNumber}?`,
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
                    cancelReservation(bookingId,roomNumber);
                }
            }
        } catch (error) {
            console.error('Error abriendo el modal:', error);
        }
    }

    async function confirmReservation(bookingId, roomNumber) {
        try {
            if (bookingId) {
                await confirmBooking(bookingId);
                showAlert('success', `Reserva confirmada`, `La habitación ${roomNumber} ahora está reservada.`, 1500);
                await loadReservations(floorSelector.value);
            }
        } catch (error) {
            console.error('Error Confirmando la reservacion:', error);
            showAlert('error', 'Error', 'Hubo un problema al confirmar la reserva.', 1500);
        }
    }

    async function cancelReservation(bookingId, roomNumber) {
        try {
            if (bookingId) {
                await cancelBooking(bookingId); // Verifica que cancelBooking esté implementada
                showAlert('success', `Reserva cancelada`, `La reserva de la habitación ${roomNumber} ha sido cancelada.`, 1500);
                loadReservations(floorSelector.value);
            }
        } catch (error) {
            console.error('Error canceling reservation:', error);
            showAlert('error', 'Error', 'Hubo un problema al cancelar la reserva.', 1500);
        }
    }

    function redirectToCheckIn(event) {
        const roomElement = event.target.closest('.room-status');
        const roomId = roomElement.getAttribute('data-room-id');
        
        window.location.href = `../pages/G_check-in.html?roomId=${roomId}`;
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

    loadReservations(); // Cargar reservas inicialmente
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
       
        try {
            const [allRooms, allBookings] = await Promise.all([getAllRooms(), getAllBookings()]);

            // Filtrar reservas confirmadas dentro del rango de fechas
            const relevantBookings = allBookings.filter(booking => {
                if (booking.status.toUpperCase() !== 'CONFIRMADA') return false;

                const bookingStart = new Date(booking.checkInDate);
                const bookingEnd = new Date(booking.checkOutDate);

                // Verificar si la reserva se superpone con el rango seleccionado
                return dateRangesOverlap(startDate, endDate, bookingStart, bookingEnd);
            });

            // Obtener IDs de habitaciones ocupadas
            const bookedRoomIds = new Set(relevantBookings.map(booking => booking.room.id));

            // Filtrar habitaciones disponibles
            const availableRooms = allRooms.filter(room => {
                // Excluir habitaciones fuera de servicio
                if (room.status.toUpperCase() === 'FUERA_DE_SERVICIO') return false;

                // Excluir habitaciones ocupadas
                if (bookedRoomIds.has(room.id)) return false;

                // Filtrar por piso si un piso específico está seleccionado
                if (floor !== 'Todos' && room.floor.toUpperCase() !== floor.toUpperCase()) return false;

                return true;
            });

            renderAvailableRoomsForReservation(availableRooms);
        } catch (error) {
            //alert('error', 'Error', 'Hubo un problema al cargar las habitaciones disponibles.', 1500);
        }
    }

    function dateRangesOverlap(start1, end1, start2, end2) {
        start1.setHours(0, 0, 0, 0);
        end1.setHours(0, 0, 0, 0);
        start2.setHours(0, 0, 0, 0);
        end2.setHours(0, 0, 0, 0);

        return start1 <= end2 && end1 >= start2;
    }

    function parseDate(dateString) {
        if (!dateString) return null;

        // Si el valor ya es un objeto Date representado como cadena
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            date.setHours(0, 0, 0, 0); // Ajustar a medianoche
            return date;
        }

        return null;
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
                    <div class="room-category">CATEGORÍA: ${room.type}</div>
                    <div class="room-status disponible" onclick="redirectToNewReservation('${room.id}', '${room.number}', '${room.type}', '${room.floor}', '${encodeURIComponent(room.details || '')}', '${room.price}')">
                        RESERVAR
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
            roomsGrid.insertAdjacentHTML('beforeend', roomCard);
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
        window.location.href = `../pages/G_registroReserva.html?RoomId=${id}&number=${number}&type=${type}&floor=${floor}&details=${details}&price=${price}&startDate=${startDate}&endDate=${endDate}`;
    };
}
//----------------------------------------------------------------------------//
             ////ESTA PARTE ES PARA LA PAGINA DE G_CHECK-IN///
//----------------------------------------------------------------------------//
// Agregar CSS al documento
const estilo = document.createElement('style');
estilo.textContent = `
    .highlight {
        border: 2px solid #ff0000;
        animation: shake 0.5s;
        animation-iteration-count: 6;
    }

    @keyframes shake {
        0% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        50% { transform: translateX(5px); }
        75% { transform: translateX(-5px); }
        100% { transform: translateX(0); }
    }
`;
document.head.append(estilo);

export async function initializeCheckInPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = parseInt(urlParams.get('roomId'), 10);
    console.log("roomId obtenido de la URL:", roomId);

    if (isNaN(roomId)) {
        return;
    }

    try {
        const bookings = await getAllBookings();

        const confirmedBookings = bookings.filter(
            booking => Number(booking.room.id) === Number(roomId) && booking.status === 'CONFIRMADA'
        );

        const reservationDetailsContainer = document.getElementById('reservationDetailsContainer');
        if (!reservationDetailsContainer) {
            return;
        }

        // Limpia el contenedor antes de agregar nuevas reservas
        reservationDetailsContainer.innerHTML = '';

        // Función para formatear las fechas
        const formatDate = (isoDateString) => {
            const date = new Date(isoDateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        };

        // Itera sobre cada reserva confirmada y crea un div individual
        for (const booking of confirmedBookings) {
            const customer = booking.customer;
            const room = booking.room;

            // Crea un div para cada info-card
            const reservationDetailsDiv = document.createElement('div');
            reservationDetailsDiv.classList.add('info-card');

            // Inserta la información de la reserva en el nuevo div
            reservationDetailsDiv.innerHTML = `
                <h2><i class="fas fa-bed"></i> Resumen de la Reserva: ${booking.id}</h2>
                <div class="info-grid">
                    <div class="info-group">
                        <label><i class="fas fa-hashtag"></i> Habitación:</label>
                        <input type="text" value="${room.number}" readonly>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-list"></i> Detalles:</label>
                        <input type="text" value="${room.details}" readonly>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-tag"></i> Categoría:</label>
                        <input type="text" value="${room.type}" readonly>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-building"></i> Piso:</label>
                        <input type="text" value="${room.floor}" readonly>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-user"></i> Cliente:</label>
                        <input type="text" value="${customer.name} ${customer.lastName}" readonly>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-id-card"></i> Nro Documento:</label>
                        <input type="text" value="${customer.documentNumber}" readonly>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-envelope"></i> Correo:</label>
                        <input type="text" value="${customer.email}" readonly>
                    </div>
                     <div class="info-group">
                        <label><i class="fas fa-calendar-plus"></i> Fecha Entrada:</label>
                        <input type="text" value="${formatDate(booking.checkInDate)}" readonly>
                    </div>
                </div>
                <br>
                <h2><i class="fas fa-concierge-bell"></i> Detalle de Hospedaje</h2>
                <div class="info-grid">
                    <div class="info-group">
                        <label><i class="fas fa-dollar-sign"></i> Precio Total:</label>
                        <input type="text" value="RD$${room.price * booking.totalStayDays}" readonly>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-money-bill-wave"></i> Cantidad Adelanto:</label>
                        <input type="text" value="RD$${booking.cashAdvance}" readonly>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-money-bill"></i> Cantidad Restante:</label>
                        <input type="text" value="RD$${booking.totalCost }" readonly>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-calendar-minus"></i> Fecha Salida:</label>
                        <input type="text" value="${formatDate(booking.checkOutDate)}" readonly>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-dollar-sign"></i> Precio Habitacion:</label>
                        <input type="text" value="RD$${room.price}" readonly>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-info"></i> Detalle:</label>
                        <input type="text" value="${booking.details}" readonly>
                    </div>
                </div>
                <div class="form-actions">
                    <button id="cancelarBtn_${booking.id}" class="cancelar-btn"><i class="fas fa-times-circle"></i> Cancelar</button>
                    <button id="registrarBtn_${booking.id}" class="register-btn"><i class="fas fa-save"></i> Confirmar Hospedaje</button>
                </div>
            <div>
            `;

            // Agrega el nuevo div al contenedor principal
            reservationDetailsContainer.appendChild(reservationDetailsDiv);

            // Asigna eventos a los botones dinámicos
            const cancelarBtn = reservationDetailsDiv.querySelector(`#cancelarBtn_${booking.id}`);
            const registrarBtn = reservationDetailsDiv.querySelector(`#registrarBtn_${booking.id}`);

            if (cancelarBtn) {
                cancelarBtn.addEventListener('click', async () => {
                    const result = await Swal.fire({
                        icon: 'question',
                        title: '¿Desea cancelar la reserva?',
                        showConfirmButton: true,
                        confirmButtonText: 'Sí, cancelar',
                        showCancelButton: true,
                        cancelButtonText: 'No',
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        allowOutsideClick: false,
                        backdrop: true,
                        heightAuto: false,
                        customClass: {
                            container: 'swal-container',
                        },
                    });

                    if (result.isConfirmed) {
                        await cancelBooking(booking.id);
                        Swal.fire({
                            icon: 'success',
                            title: 'Cancelada',
                            text: 'La reserva ha sido cancelada.',
                            heightAuto: false,
                            customClass: {
                                container: 'swal-container',
                            },
                        }).then(() => {
                            location.reload();
                        });
                        
                    }
                });
            }

            if (registrarBtn) {
                registrarBtn.addEventListener('click', async () => {
                    const previousBooking = confirmedBookings.find(b => new Date(b.checkInDate) < new Date(booking.checkInDate));

                    if (previousBooking) {
                        const previousDiv = document.querySelector(`#reservationDetailsContainer .info-card:nth-child(${confirmedBookings.indexOf(previousBooking) + 1})`);
                        if (previousDiv) {
                            previousDiv.classList.add('highlight');
                            setTimeout(() => {
                                previousDiv.classList.remove('highlight');
                            }, 3000);
                        }

                        await Swal.fire({
                            icon: 'error',
                            title: 'No se puede confirmar',
                            text: 'Hay una reserva previa que debe ser confirmada o cancelada primero.',
                            confirmButtonText: 'Entendido',
                            confirmButtonColor: '#3085d6',
                            allowOutsideClick: false,
                            heightAuto: false,
                            customClass: {
                                container: 'swal-container',
                            },
                        });
                        return;
                    }

                    const result = await Swal.fire({
                        icon: 'question',
                        title: '¿Desea confirmar la reserva?',
                        showConfirmButton: true,
                        confirmButtonText: 'Sí, confirmar',
                        showCancelButton: true,
                        cancelButtonText: 'No',
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        allowOutsideClick: false,
                        backdrop: true,
                        heightAuto: false,
                        customClass: {
                            container: 'swal-container',
                        },
                    });

                    if (result.isConfirmed) {
                        await checkInBooking(booking.id, booking.cashAdvance);
                    
                        await Swal.fire({
                            icon: 'success', // Cambia a un ícono de check
                            title: 'Confirmada',
                            text: 'La reserva ha sido confirmada exitosamente.',
                            backdrop: true,
                            heightAuto: false,
                            customClass: {
                                container: 'swal-container',
                            },
                            confirmButtonText: 'Aceptar',
                            confirmButtonColor: '#3085d6',
                        });
                    
                        window.location.href = '../pages/G_reservaciones.html';
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error al inicializar la página de check-in:', error);
    }   
}


//----------------------------------------------------------------------------//
             ////ESTA PARTE ES PARA LA PAGINA DE G_SALIDA///
//----------------------------------------------------------------------------//
// Funcion para obtener reservaciones activas
export async function getActiveReservations() {
    try {
        const allBookings = await getAllBookings();
        return allBookings.filter(booking => 
            booking.status === 'CHECKED_IN' && booking.isActive
        );
    } catch (error) {
        console.error('Error fetching active reservations:', error);
        throw error;
    }
}

export function initializeCheckOutPage() {
    const roomsGrid = document.querySelector('.rooms-grid');
    const floorSelector = document.querySelector('.floor-selector');

    async function loadActiveReservations(floor = 'Todos') {
        try {
            const activeReservations = await getActiveReservations();
            const reservationsToShow = activeReservations.filter(reservation =>
                floor === 'Todos' || reservation.room.floor.toUpperCase() === floor
            );
            renderActiveReservations(reservationsToShow);
        } catch (error) {
            console.error('Error loading active reservations:', error);
        }
    }

    function renderActiveReservations(reservations) {
        roomsGrid.innerHTML = '';
        reservations.forEach(reservation => {
            const roomCard = `
                <div class="room-card ocupado">
                    <div class="room-header">
                        <span class="room-number">NRO: ${reservation.room.number}</span>
                        <i class="fas fa-user-check room-icon"></i>
                    </div>
                    <div class="room-category">
                        CATEGORIA: ${reservation.room.type}
                    </div>
                    <div class="room-status ocupado" onclick="redirectTosalidaHabitacion('${reservation.id}')">
                        CHECK-OUT
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
            roomsGrid.insertAdjacentHTML('beforeend', roomCard);
        });
    }

    floorSelector.addEventListener('change', () => loadActiveReservations(floorSelector.value));

    // Initial load
    loadActiveReservations();

    // Expose function to window object for the onclick event
    window.redirectTosalidaHabitacion = function(reservationId) {
        window.location.href = `../pages/G_salidaHabitacion.html?reservationId=${reservationId}`;
    };
}