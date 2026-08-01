import { createCustomer, getCustomerByDocumentNumber, updateCustomer } from '../integrations/customer.integration.js';
import { createBooking, confirmBooking, cancelBooking, checkInBooking, getAllBookings, updateBooking, getBookingById,checkOutBooking, desactiveBooking } from '../integrations/booking.integration.js';
import { updateRoom,getAllRooms,getRoomById } from '../integrations/room.integration.js';
import { getAllInvoices } from '../integrations/billing.integration.js';

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
                confirmButtonText: 'Entendido',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
        } else if (bookingResult) {
            await handleBookingConfirmation(bookingResult);
        } else {
            console.log('Booking creation returned unexpected result');
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema inesperado al crear la reserva. Por favor, intente nuevamente.',
                confirmButtonText: 'Entendido',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
        }
    } catch (error) {
        console.error('Error en el proceso de reserva:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Hubo un problema al procesar la reserva.',
            confirmButtonText: 'Entendido',
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });
    }
}

function validateForm() {
    let isValid = true;

    // Expresiones regulares para validaciones (mismo criterio que la pantalla de Clientes)
    const docRegex = /^[a-zA-Z0-9-]+$/; // Documento: letras, números y guiones (ej. cédula 001-1234567-1)
    const nameRegex = /^[\p{L}\s]+$/u; // Letras (incluye tildes y ñ) y espacios
    const phoneRegex = /^[\d-]+$/; // Números y guiones
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
            allowOutsideClick: false,
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
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
                allowOutsideClick: false,
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
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
                confirmButtonText: 'Aceptar',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
        }
    } catch (error) {
        console.error('Error al confirmar la reserva:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al confirmar la reserva. Intente nuevamente.',
            confirmButtonText: 'Entendido',
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
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
        allowOutsideClick: false,
        heightAuto: false,
        customClass: {
            container: 'swal-container',
        },
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

// Función que calcula las ventas totales sumando `cashAdvance` de reservas y `total` de facturas.
export async function calculateTotalSales() {
    try {
        // Obtener todas las reservas
        const bookings = await getAllBookings();

        // Calcular el total de `cashAdvance` de las reservas
        const totalCashAdvance = bookings.reduce((total, booking) => {
            const cashAdvance = parseFloat(booking.cashAdvance) || 0;
            return total + cashAdvance;
        }, 0);

        // Obtener todas las facturas
        const invoices = await getAllInvoices();

        // Calcular el total de las facturas sumando el campo `total`
        const totalInvoices = invoices.reduce((total, invoice) => {
            const invoiceTotal = parseFloat(invoice.total) || 0;
            return total + invoiceTotal;
        }, 0);

        // Calcular el total general
        const totalSales = totalCashAdvance + totalInvoices;

        // Actualizar el contenido del DOM con el resultado
        const totalSalesElement = document.querySelector('.metric-value');
        if (totalSalesElement) {
            totalSalesElement.textContent = `RD$${totalSales.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`;
        }
    } catch (error) {
        console.error('Error al calcular las ventas totales:', error);
    }
}

// Ejecutar la función al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    calculateTotalSales();
});


// Genera gráfico de las ventas mensuales considerando `cashAdvance` y `total` de facturas
export async function renderSalesChart() {
    try {
        // Obtener todas las reservas
        const bookings = await getAllBookings();

        // Obtener todas las facturas
        const invoices = await getAllInvoices();

        // Agrupar `cashAdvance` de reservas por mes
        const cashAdvanceByMonth = bookings.reduce((acc, booking) => {
            const checkOutDate = new Date(booking.actualCheckOutDate || booking.checkOutDate);
            const yearMonth = `${checkOutDate.getFullYear()}-${String(checkOutDate.getMonth() + 1).padStart(2, '0')}`;

            const cashAdvance = parseFloat(booking.cashAdvance) || 0;
            acc[yearMonth] = (acc[yearMonth] || 0) + cashAdvance;
            return acc;
        }, {});

        // Agrupar `total` de facturas por mes
        const invoiceTotalByMonth = invoices.reduce((acc, invoice) => {
            const invoiceDate = new Date(invoice.createdAt);
            const yearMonth = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;

            const invoiceTotal = parseFloat(invoice.total) || 0;
            acc[yearMonth] = (acc[yearMonth] || 0) + invoiceTotal;
            return acc;
        }, {});

        // Combinar `cashAdvance` y `invoiceTotal` en un solo objeto
        const combinedSalesByMonth = { ...cashAdvanceByMonth };
        for (const [month, total] of Object.entries(invoiceTotalByMonth)) {
            combinedSalesByMonth[month] = (combinedSalesByMonth[month] || 0) + total;
        }

        // Generar etiquetas y datos para el gráfico
        const sortedMonths = Object.keys(combinedSalesByMonth).sort(); // Etiquetas (meses ordenados)
        const salesData = sortedMonths.map(month => combinedSalesByMonth[month]); // Datos (ventas por mes)

        // Configurar el gráfico (con colores según el tema activo)
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#c8cad8' : '#333';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)';

        const ctx = document.getElementById('salesChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedMonths, // Etiquetas del eje X (meses)
                datasets: [{
                    label: 'Ventas Mensuales',
                    data: salesData, // Datos del eje Y (ventas por mes)
                    borderColor: '#ab2497',
                    backgroundColor: 'rgba(171, 36, 151, 0.2)',
                    tension: 0.4,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Meses',
                            color: textColor,
                            font: {
                                size: 14,
                                weight: 'bold',
                            },
                        },
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Ventas (RD$)',
                            color: textColor,
                            font: {
                                size: 14,
                                weight: 'bold',
                            },
                        },
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                return 'RD$' + value.toLocaleString();
                            }
                        },
                        grid: { color: gridColor },
                    }
                },
                plugins: {
                    legend: {
                        display: true, // Mostrar la leyenda del gráfico
                        labels: {
                            color: textColor,
                            font: {
                                size: 12,
                                weight: 'bold',
                            },
                        },
                    }
                }
            }
        });

        console.log('Gráfico de ventas generado correctamente.');
    } catch (error) {
        console.error('Error al renderizar el gráfico de ventas:', error);
    }
}

// Llamar a la función al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    renderSalesChart();
});


/**
 * Muestra una alerta con todas las notificaciones y sus respectivos botones.
 * @param {Array} notifications - Lista de notificaciones a mostrar.
 */
function showNotificationQueue(notifications) {
    // Crear el contenido HTML para todas las notificaciones
    const notificationsHTML = notifications.map(({ text, roomNumber, alertType }) => {
        const borderColor = {
            'CHECKED_IN': '#ff3d00',
            'PENDIENTE': 'purple',
            'CONFIRMADA': 'orange',
        }[alertType] || 'gray';

        const buttonColor = {
            'CHECKED_IN': '#ff3d00',
            'PENDIENTE': '#800080',
            'CONFIRMADA': 'orange',
        }[alertType] || '#808080';

        const targetPage = alertType === 'CHECKED_IN' ? 'G_salida.html' : 'G_reservaciones.html';

        return `
            <div class="notification-item swal-popup-${alertType.toLowerCase()}" style="border-left: 5px solid ${borderColor};">
                <div class="notification-content">
                    <span class="notification-text">${text}</span>
                    <button class="notification-button" style="background-color: ${buttonColor}; border-color: ${borderColor}" onclick="window.location.href='${targetPage}'">Ir</button>
                </div>
            </div>
        `;
    }).join('');

    // Mostrar una sola alerta con todas las notificaciones
    Swal.fire({
        toast: true,
        position: 'bottom-start',
        title: '<strong>Notificaciones</strong>',
        html: `<div class="notifications-container">${notificationsHTML}</div>`,
        showConfirmButton: false,
        showCloseButton: true,
        closeButtonAriaLabel: 'Cerrar', // Label accesible para la X
        customClass: {
            popup: 'swal-popup-container',
            title: 'swal-popup-title', // Clase personalizada para el título
            closeButton: 'swal-close-button', // Clase personalizada para el botón de cerrar
        },
    });
}

/**
 * Comprueba las reservas y genera notificaciones según las condiciones.
 */
export async function checkReservationsAndNotify() {
    try {
        const bookings = await getAllBookings();
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizar la hora a 00:00:00

        const notifications = [];

        for (const booking of bookings) {
            const checkInDate = new Date(booking.checkInDate);
            const checkOutDate = new Date(booking.checkOutDate);

            // Obtener el número de habitación
            const room = await getRoomById(booking.room.id);
            const roomNumber = room.number;

            // Si la reserva está CHECKED_IN y el checkOutDate es hoy
            if (booking.status === 'CHECKED_IN' && checkOutDate.getTime() === today.getTime()) {
                notifications.push({
                    text: `Hoy termina el hospedaje de la habitación ${roomNumber}`,
                    roomNumber,
                    alertType: 'CHECKED_IN',
                });
            }

            // Si la reserva está PENDIENTE y el checkInDate es hoy
            if (booking.status === 'PENDIENTE' && checkInDate.getTime() === today.getTime()) {
                notifications.push({
                    text: `Hoy caduca la reserva de la habitación ${roomNumber}`,
                    roomNumber,
                    alertType: 'PENDIENTE',
                });
            }

            // Si la reserva está CONFIRMADA y el checkInDate es hoy
            if (booking.status === 'CONFIRMADA' && checkInDate.getTime() === today.getTime()) {
                notifications.push({
                    text: `La reserva confirmada para la habitación ${roomNumber} no se inició`,
                    roomNumber,
                    alertType: 'CONFIRMADA',
                });
            }
        }

        // Mostrar todas las notificaciones en una sola alerta
        if (notifications.length > 0) {
            showNotificationQueue(notifications);
        }
    } catch (error) {
        console.error('Error al comprobar las reservas:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un problema al verificar las reservas. Por favor, inténtalo nuevamente.',
        });
    }
}

/**
 * CSS dinámico para notificaciones con bordes personalizados y estilos pequeños.
 */
const notificationStyles = `
/* Estilo general para notificaciones */
.swal-popup-container {
    width: 250px !important; 
    font-size: 12px !important; /* Tamaño de fuente reducido */
    padding: 0px !important;
}

.swal-popup-title {
    font-size: 14px !important; /* Título más grande */
    font-weight: bold;
    text-align: center;
}

.notifications-container {
    max-height: 400px;
    overflow-y: auto;
}

.notification-item {
    margin-bottom: 10px;
    padding: 5px;
    box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1); /* Sombra del contorno */
}

.notification-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 5px; /* Espacio entre el texto y el botón */
}

.notification-text {
    font-size: 12px;
    cursor: default; /* Cambiar el cursor a default para el texto */
}

.notification-button {
    background: none;
    border: 1px solid;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    transition: background-color 0.3s;
    color: #fff;
    flex-shrink: 0;
}

.notification-button:hover {
    background-color: rgba(0, 123, 255, 0.1);
    color: #000;
}

/* Colores personalizados según el tipo de alerta */
.swal-popup-checked_in {
    border-color: red !important;
}
.swal-popup-pendiente {
    border-color: purple !important;
}
.swal-popup-confirmada {
    border-color: orange !important;
}

/* Estilo personalizado para el botón de cerrar */
.swal-close-button {
    position: absolute;
    top: 10px;
    right: 5px;
    font-size: 1.8rem !important; /* Más grande */
    color: #d33; /* Color rojo para mayor visibilidad */
    cursor: pointer;
}
`;

// Inyectar el CSS en el documento
const styleElement = document.createElement('style');
styleElement.type = 'text/css';
styleElement.textContent = notificationStyles;
document.head.appendChild(styleElement);

// Ejecutar la función al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    checkReservationsAndNotify();
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

            // Filtrar reservas por estado y evitar duplicados por habitación usando un Map.
            // Las activas (pendiente/confirmada) tienen prioridad; una habitación solo
            // muestra su reserva cancelada si no tiene ninguna reserva activa encima.
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
            allReservations.forEach(reservation => {
                const status = reservation.status?.toLowerCase() || '';
                if (status === 'cancelada') {
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
            const normalizedStatus = (status || '').toLowerCase();
            const statusClass = normalizedStatus === 'confirmada' ? 'reservado'
                : normalizedStatus === 'cancelada' ? 'cancelled'
                : 'confirmar';
            const statusText = normalizedStatus === 'confirmada' ? 'INICIAR HOSPEDAJE'
                : normalizedStatus === 'cancelada' ? 'CANCELADA'
                : 'CONFIRMAR RESERVA';
            const statusIcon = statusClass === 'reservado' ? 'fa-calendar-check'
                : statusClass === 'cancelled' ? 'fa-ban'
                : 'fa-check-circle';

            const roomCard = `
                <div class="room-card ${statusClass}">
                    <div class="room-header">
                        <span class="room-number">NRO: ${roomDetails?.number || 'No disponible'}</span>
                        <i class="fas ${statusIcon} room-icon"></i>
                    </div>
                    <div class="room-category">
                        CATEGORÍA: ${roomDetails?.type || 'Sin categoría'}
                    </div>
                    <div class="room-status ${statusClass}" data-id="${id}" data-room-id="${roomDetails?.id}">
                        ${statusText}
                        ${statusClass !== 'cancelled' ? '<i class="fas fa-chevron-right"></i>' : ''}
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

            // Agrupa las dos tarjetas de esta reserva (resumen + hospedaje)
            // para poder resaltarlas juntas y para que el conteo de
            // "reserva anterior" siga siendo uno por reserva.
            const reservationDetailsDiv = document.createElement('div');
            reservationDetailsDiv.classList.add('checkin-booking');

            // Inserta la información de la reserva en el nuevo div
            reservationDetailsDiv.innerHTML = `
                <div class="panel-card">
                <div class="panel-card-header">
                    <h3 class="panel-card-title">Resumen de la Reserva #${booking.id}</h3>
                </div>
                <div class="panel-stats-row">
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-hashtag"></i></div>
                        <div class="panel-stat-body">
                            <span class="panel-stat-label">Habitación</span>
                            <span class="panel-stat-value">${room.number}</span>
                        </div>
                    </div>
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-list"></i></div>
                        <div class="panel-stat-body">
                            <span class="panel-stat-label">Detalles</span>
                            <span class="panel-stat-value">${room.details}</span>
                        </div>
                    </div>
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-tag"></i></div>
                        <div class="panel-stat-body">
                            <span class="panel-stat-label">Categoría</span>
                            <span class="panel-stat-value">${room.type}</span>
                        </div>
                    </div>
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-building"></i></div>
                        <div class="panel-stat-body">
                            <span class="panel-stat-label">Piso</span>
                            <span class="panel-stat-value">${room.floor}</span>
                        </div>
                    </div>
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-user"></i></div>
                        <div class="panel-stat-body">
                            <span class="panel-stat-label">Cliente</span>
                            <span class="panel-stat-value">${customer.name} ${customer.lastName}</span>
                        </div>
                    </div>
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-id-card"></i></div>
                        <div class="panel-stat-body">
                            <span class="panel-stat-label">Nro Documento</span>
                            <span class="panel-stat-value">${customer.documentNumber}</span>
                        </div>
                    </div>
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-envelope"></i></div>
                        <div class="panel-stat-body">
                            <span class="panel-stat-label">Correo</span>
                            <span class="panel-stat-value">${customer.email}</span>
                        </div>
                    </div>
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-calendar-plus"></i></div>
                        <div class="panel-stat-body">
                            <span class="panel-stat-label">Fecha Entrada</span>
                            <span class="panel-stat-value">${formatDate(booking.checkInDate)}</span>
                        </div>
                    </div>
                </div>
                </div>

                <div class="panel-card">
                <div class="panel-card-header">
                    <h3 class="panel-card-title">Detalle de Hospedaje</h3>
                </div>
                <div class="panel-stats-row">
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-dollar-sign"></i></div>
                        <div class="panel-stat-body">
                            <span class="panel-stat-label">Precio Total</span>
                            <span class="panel-stat-value">RD$${room.price * booking.totalStayDays}</span>
                        </div>
                    </div>
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-money-bill-wave"></i></div>
                        <div class="panel-stat-body">
                            <label class="panel-stat-label" for="adelantoCheckIn_${booking.id}">Cantidad Adelanto</label>
                            <input type="number" id="adelantoCheckIn_${booking.id}" class="panel-stat-value" min="0" step="0.01" value="${booking.cashAdvance || 0}">
                        </div>
                    </div>
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-money-bill"></i></div>
                        <div class="panel-stat-body">
                            <span class="panel-stat-label">Cantidad Restante</span>
                            <span class="panel-stat-value">RD$${booking.totalCost}</span>
                        </div>
                    </div>
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-calendar-minus"></i></div>
                        <div class="panel-stat-body">
                            <span class="panel-stat-label">Fecha Salida</span>
                            <span class="panel-stat-value">${formatDate(booking.checkOutDate)}</span>
                        </div>
                    </div>
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-dollar-sign"></i></div>
                        <div class="panel-stat-body">
                            <span class="panel-stat-label">Precio Habitación</span>
                            <span class="panel-stat-value">RD$${room.price}</span>
                        </div>
                    </div>
                    <div class="panel-stat">
                        <div class="panel-icon-box panel-stat-icon"><i class="fas fa-info"></i></div>
                        <div class="panel-stat-body">
                            <span class="panel-stat-label">Detalle</span>
                            <span class="panel-stat-value">${booking.details}</span>
                        </div>
                    </div>
                </div>
                <div class="panel-form-actions">
                    <button id="cancelarBtn_${booking.id}" class="panel-btn-outline panel-btn-danger"><i class="fas fa-times-circle"></i> Cancelar</button>
                    <button id="registrarBtn_${booking.id}" class="panel-btn-gradient"><i class="fas fa-save"></i> Confirmar Hospedaje</button>
                </div>
                </div>
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
                        const previousDiv = document.querySelector(`#reservationDetailsContainer .checkin-booking:nth-child(${confirmedBookings.indexOf(previousBooking) + 1})`);
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
                        try {
                            const adelantoInput = document.getElementById(`adelantoCheckIn_${booking.id}`);
                            const cashAdvance = adelantoInput ? Number(adelantoInput.value) : booking.cashAdvance;
                            // La reserva debe quedar con el adelanto actualizado antes del
                            // check-in: el backend exige que tanto el monto guardado en la
                            // reserva como el enviado en este paso sean mayores a cero.
                            await updateBooking({ id: booking.id, cashAdvance });
                            await checkInBooking(booking.id, cashAdvance);

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
                        } catch (error) {
                            console.error('Error al hacer check-in:', error);
                            await Swal.fire({
                                icon: 'error',
                                title: 'No se pudo iniciar el hospedaje',
                                text: error.message || 'Hubo un problema al iniciar el hospedaje.',
                                confirmButtonText: 'Entendido',
                                backdrop: true,
                                heightAuto: false,
                                customClass: {
                                    container: 'swal-container',
                                },
                            });
                        }
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