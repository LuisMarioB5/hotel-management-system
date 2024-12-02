import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { validateParamIsNotNull } from '../scripts/utils.js';
import { getAllBookings } from '../integrations/booking.integration.js';
import { generateConsumptionsReportPDF, generateBookingsByRoomReportPDF, generateTopConsumptionsReportPDF  } from '../integrations/reports.integration.js';
import { getAllRooms } from '../integrations/room.integration.js';

const { jsPDF } = window.jspdf;

// Variable para evitar múltiples ejecuciones
let isGeneratingReport = false;

// Función global para descargar el reporte de productos/servicios
window.downloadProductsReportPDF = async function (status, category) {
    validateParamIsNotNull('status', status);
    validateParamIsNotNull('category', category);

    if (isGeneratingReport) return; // Salir si ya se está generando un reporte
    isGeneratingReport = true; // Marcar el inicio del proceso

    try {
        // Mostrar alerta de carga mientras se genera el reporte
        Swal.fire({
            title: 'Generando reporte...',
            text: 'Por favor, espera mientras preparamos tu archivo.',
            icon: 'info',
            allowOutsideClick: false,
            heightAuto: false, // Prevenir barra blanca
            customClass: {
                container: 'swal-container',
            },
            didOpen: () => Swal.showLoading(),
        });

        const response = await fetch(BACKEND_ROUTES.products.getAll, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error en la respuesta del servidor:', errorText);

            // Mostrar alerta de error
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al generar el reporte. Por favor, inténtalo de nuevo.',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
            return;
        }

        const products = await response.json();

        const filteredProducts = products.filter(product => {
            const matchStatus =
                status === 'all' ||
                (status === 'activo' && product.isActive) ||
                (status === 'inactivo' && !product.isActive);
            const matchCategory = category === 'all' || product.category === category;
            return matchStatus && matchCategory;
        });

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Reporte de Productos/Servicios', 14, 22);
        doc.setFontSize(12);
        doc.text(
            `Estado: ${status.charAt(0).toUpperCase() + status.slice(1)}, Categoría: ${
                category.charAt(0).toUpperCase() + category.slice(1)
            }`,
            14,
            30
        );

        doc.autoTable({
            startY: 40,
            head: [['ID', 'Nombre', 'Precio', 'Cantidad', 'Categoría', 'Estado']],
            body: filteredProducts.map(product => [
                product.id,
                product.name,
                product.unitPrice,
                product.quantity,
                product.category,
                product.isActive ? 'Activo' : 'Inactivo',
            ]),
            styles: { fontSize: 10 },
            headStyles: { fillColor: [22, 160, 133] },
            alternateRowStyles: { fillColor: [240, 240, 240] },
        });

        doc.save('products_report.pdf');

        // Mostrar éxito
        await Swal.fire({
            icon: 'success',
            title: 'Reporte generado',
            text: 'El reporte de productos/servicios se ha descargado correctamente.',
            timer: 2000,
            showConfirmButton: false,
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });
    } catch (error) {
        console.error('Error al generar el reporte:', error);

        // Mostrar alerta de error
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error inesperado al generar el reporte.',
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });
    } finally {
        isGeneratingReport = false; // Marcar como terminado en todos los casos
    }
};

// Integrar la función de descarga en el HTML
document.querySelector('.downloadproduct-btn').addEventListener('click', async () => {
    const status = document.getElementById('status').value;
    const category = document.getElementById('category').value;

    if (!status || !category) {
        await Swal.fire({
            icon: 'warning',
            title: 'Parámetros requeridos',
            text: 'Por favor, selecciona el estado y la categoría antes de continuar.',
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });
        return;
    }

    await downloadProductsReportPDF(status, category);
});


/**
 * Carga los IDs de las reservas con estado CHECKED_OUT en el `<select>` de reservas.
 */
export async function loadReservationIDs() {
    const select = document.getElementById('reservation-select');

    try {
        const bookings = await getAllBookings();
        const checkedOutBookings = bookings.filter(booking => booking.status === 'CHECKED_OUT');

        // Limpiar el select antes de llenarlo
        select.innerHTML = '<option value="">Seleccione una reserva</option>';

        // Agregar las reservas al select
        checkedOutBookings.forEach(booking => {
            const option = document.createElement('option');
            option.value = booking.id;
            option.textContent = `Reserva ${booking.id}`;
            select.appendChild(option);
        });

        // Configurar botón para abrir la alerta
        setupSearchButton(checkedOutBookings);
    } catch (error) {
        console.error('Error al cargar las reservas:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las reservas. Verifica tu conexión o intenta nuevamente.',
        });
    }
}
/**
 * Configura el botón de búsqueda para abrir la alerta con la lista de reservas.
 * @param {Array} bookings - Lista de reservas en estado CHECKED_OUT.
 */
function setupSearchButton(bookings) {
    const searchButton = document.getElementById('open-reservation-modal');

    searchButton.addEventListener('click', async () => {
        if (bookings.length === 0) {
            await Swal.fire({
                icon: 'info',
                title: 'No hay reservas',
                text: 'Actualmente no hay reservas en estado CHECKED_OUT.',
            });
            return;
        }

        await showReservationSelectionAlert(bookings);
    });
}

/**
 * Muestra una alerta con todas las reservas en CHECKED_OUT.
 * Al hacer clic en una reserva, selecciona automáticamente esa opción en el `<select>`.
 * @param {Array} bookings - Lista de reservas en estado CHECKED_OUT.
 */
async function showReservationSelectionAlert(bookings) {
    const reservationList = bookings
        .map(
            booking =>
                `<li style="
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 10px 20px;
                background-color: #28a745;
                color: white;
                font-weight: bold;
                font-size: 12px; 
                border: none;
                border-radius: 4px;
                cursor: pointer;
                width: 100%;
                max-width: 120px;
                align-self: flex-end; " 
                 onclick="selectReservation(${booking.id})">
                 Reserva ${booking.id} - ${booking.customer?.name || 'Sin nombre'}
                 </li>`
        )
        .join('');

    await Swal.fire({
        title: 'Selecciona una reserva',
        html: `<ul style="text-align: left; list-style: none; padding: 0;">${reservationList}</ul>`,
        showConfirmButton: false, // No mostrar botón de confirmar
        heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
    });
}

/**
 * Selecciona automáticamente una reserva en el `<select>` según su ID.
 * @param {number} id - ID de la reserva a seleccionar.
 */
window.selectReservation = function (id) {
    const select = document.getElementById('reservation-select');
    select.value = id;

    Swal.close(); // Cerrar la alerta cuando se selecciona una reserva
};

/**
 * Configura los botones para exportar reportes.
 */
export function setupExportButtons() {
    const select = document.getElementById('reservation-select');
    const downloadConsumptionsButton = document.getElementById('download-consumptions-report');
    const downloadProductsButton = document.getElementById('download-products-report');

    // Descargar reporte de consumos
    downloadConsumptionsButton.addEventListener('click', async () => {
        const reservationId = select.value;

        if (!reservationId) {
            await Swal.fire({
                icon: 'warning',
                title: 'Selección requerida',
                text: 'Por favor, seleccione una reserva para generar el reporte.',
            });
            return;
        }

        try {
            await generateConsumptionsReportPDF(Number(reservationId));
            await Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'El reporte de consumos se descargó correctamente.',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error al generar el reporte de consumos:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo descargar el reporte de consumos. Intenta nuevamente.',
            });
        }
    });

    // Descargar reporte de productos/servicios ofrecidos
    downloadProductsButton.addEventListener('click', async () => {
        try {
            await generateProductsOfferedReportPDF(true, 'Todos'); // Ajusta los parámetros según tus necesidades
            await Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'El reporte de productos/servicios se descargó correctamente.',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error al generar el reporte de productos/servicios:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo descargar el reporte de productos/servicios. Intenta nuevamente.',
            });
        }
    });
}
const styles = `
.search-button {
    background: none;
    border: none;
    cursor: pointer;
    margin-left: 0px;
    
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 12px;
    box-sizing: border-box;
}
.search-button i {
    font-size: 1.2rem;
    color: #28a745;
}
.search-button:hover i {
    color: rgb(6, 82, 6);
}
    
`;

// Inyectar el CSS en el documento
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

//
// Exportacion de habitacion reservadas
//

/**
 * CSS para estilizar el botón de búsqueda.
 */
// Función para cargar todas las habitaciones en el <select> de habitaciones
export async function loadRoomNumbers() {
    const select = document.getElementById('room-number');

    try {
        const rooms = await getAllRooms();

        // Limpiar el select antes de llenarlo
        select.innerHTML = '<option value="">Seleccione una habitación</option>';

        // Agregar las habitaciones al select
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = `Habitación ${room.number}`;
            select.appendChild(option);
        });

        // Actualizar el campo oculto cuando se selecciona una habitación desde el select
        select.addEventListener('change', function() {
            const selectedOption = select.options[select.selectedIndex];
            const hiddenInput = document.getElementById('room-id-hidden');
            if (hiddenInput) {
                hiddenInput.value = selectedOption.value;
            }
        });

    } catch (error) {
        console.error('Error al cargar las habitaciones:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las habitaciones. Verifica tu conexión o intenta nuevamente.',
        });
    }
}

// Función para mostrar la alerta de selección de habitación
export async function showRoomSelectionAlert() {
    try {
        const rooms = await getAllRooms();

        if (!rooms.length) {
            await Swal.fire({
                icon: 'info',
                title: 'No hay habitaciones',
                text: 'Actualmente no hay habitaciones disponibles para mostrar.',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
            return;
        }

        // Generar las habitaciones en un diseño de cuadrícula (3 columnas)
        const roomList = rooms
            .map(
                room =>
                    `<div 
                        class="room-item" 
                        onclick="selectRoom(${room.id}, '${room.number}')">
                        Habitación ${room.number}
                    </div>`
            )
            .join('');

        await Swal.fire({
            title: 'Selecciona una habitación',
            html: `<div class="room-grid">${roomList}</div>`,
            showConfirmButton: false,
            heightAuto: false,
            customClass: {
                container: 'swal-container',
                popup: 'swal-popup',
            },
        });
    } catch (error) {
        console.error('Error al cargar las habitaciones:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las habitaciones. Por favor, intenta nuevamente.',
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });
    }
}

// Función para seleccionar una habitación y actualizar los campos correspondientes
window.selectRoom = function (id, number) {
    const roomSelect = document.getElementById('room-number');
    const hiddenInput = document.getElementById('room-id-hidden');

    // Actualizar el select con el número de la habitación y el campo oculto con el ID
    if (roomSelect) {
        roomSelect.value = id; // Actualizamos el valor visible con el ID de la habitación
    }
    if (hiddenInput) {
        hiddenInput.value = id; // Actualizamos el ID de la habitación en el input oculto
    }

    Swal.close(); // Cerrar la alerta
}

// Función para formatear las fechas en MM/dd/yyyy
function formatDateToMMDDYYYY(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day, year].join('/');
}

// Función para generar el reporte usando el ID de la habitación seleccionada
window.generateRoomReport = function () {
    const roomId = document.getElementById('room-id-hidden').value;

    if (!roomId) {
        Swal.fire({
            icon: 'warning',
            title: 'Selección requerida',
            text: 'Por favor, selecciona una habitación antes de generar el reporte.',
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });
        return;
    }

    const startDate = document.getElementById('fechaEntrada').value;
    const endDate = document.getElementById('fechaSalida').value;

    if (!startDate || !endDate) {
        Swal.fire({
            icon: 'warning',
            title: 'Fechas requeridas',
            text: 'Por favor, selecciona una fecha de inicio y una fecha de fin antes de generar el reporte.',
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });
        return;
    }

    // Formatear las fechas en MM/dd/yyyy
    const formattedStartDate = formatDateToMMDDYYYY(startDate);
    const formattedEndDate = formatDateToMMDDYYYY(endDate);

    // Llamar a la función para generar el PDF del reporte
    generateBookingsByRoomReportPDF(roomId, formattedStartDate, formattedEndDate);
    console.log(`Generando reporte para la habitación con ID ${roomId} desde ${formattedStartDate} hasta ${formattedEndDate}`);
}

// CSS dinámico para estilizar las habitaciones en la alerta
const roomAlertStyles = `
/* Estilo para la cuadrícula de habitaciones */
.room-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 3 columnas */
    gap: 10px;
    padding: 20px;
    justify-items: center;
}

/* Estilo para cada elemento de la habitación */
.room-item {
    padding: 10px;
    background-color: #28a745;
    color: white;
    font-weight: normal;
    font-size: 12px; /* Tamaño de fuente más pequeño */
    border-radius: 5px;
    text-align: center;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.room-item:hover {
    background-color: rgb(6, 82, 6);
}

/* Botón para mostrar habitaciones */
#show-rooms-btn {
    background: none;
    border: none;
    cursor: pointer;
    margin-left: 0px;
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 12px;
    box-sizing: border-box;
}
#show-rooms-btn i {
    font-size: 1.2rem;
    color: #28a745;
}
#show-rooms-btn:hover i {
    color: rgb(6, 82, 6);
}
`;

// Inyectar el CSS en el documento
const roomAlertStyleSheet = document.createElement('style');
roomAlertStyleSheet.type = 'text/css';
roomAlertStyleSheet.innerText = roomAlertStyles;
document.head.appendChild(roomAlertStyleSheet);

// Configurar el botón para mostrar la alerta de habitaciones
document.getElementById('show-rooms-btn').addEventListener('click', showRoomSelectionAlert);

// Función para generar el reporte usando el ID de la habitación seleccionada
window.generateRoomReport = function () {
    const roomId = document.getElementById('room-id-hidden').value;

    if (!roomId) {
        Swal.fire({
            icon: 'warning',
            title: 'Selección requerida',
            text: 'Por favor, selecciona una habitación antes de generar el reporte.',
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });
        return;
    }

    const startDate = document.getElementById('fechaEntrada').value;
    const endDate = document.getElementById('fechaSalida').value;

    if (!startDate || !endDate) {
        Swal.fire({
            icon: 'warning',
            title: 'Fechas requeridas',
            text: 'Por favor, selecciona una fecha de inicio y una fecha de fin antes de generar el reporte.',
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });
        return;
    }

    // Formatear las fechas en MM/dd/yyyy
    const formattedStartDate = formatDateToMMDDYYYY(startDate);
    const formattedEndDate = formatDateToMMDDYYYY(endDate);

    // Llamar a la función para generar el PDF del reporte
    generateBookingsByRoomReportPDF(roomId, formattedStartDate, formattedEndDate);
    console.log(`Generando reporte para la habitación con ID ${roomId} desde ${formattedStartDate} hasta ${formattedEndDate}`);
}

// Cargar los números de las habitaciones al cargar la página
loadRoomNumbers();


/**
 * Genera un reporte de los productos/servicios más utilizados según los parámetros seleccionados.
 * Se toman los valores de `#topProSer` (límite) y `#topcategory` (categoría).
 */
export async function generateTopConsumptionsReport() {
    try {
        // Obtener valores de los campos del formulario
        const limit = parseInt(document.getElementById('topProSer').value, 10);
        const category = document.getElementById('topcategory').value;

        // Validar los valores
        if (isNaN(limit) || limit <= 0) {
            await Swal.fire({
                icon: 'warning',
                title: 'Límite inválido',
                text: 'Por favor, selecciona un límite válido.',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
            return;
        }

        if (!category) {
            await Swal.fire({
                icon: 'warning',
                title: 'Categoría requerida',
                text: 'Por favor, selecciona una categoría antes de generar el reporte.',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
            return;
        }

        // Mostrar mensaje de carga mientras se genera el reporte
        Swal.fire({
            title: 'Generando reporte...',
            text: 'Por favor, espera mientras preparamos tu archivo.',
            icon: 'info',
            allowOutsideClick: false,
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
            didOpen: () => Swal.showLoading(),
        });

        // Llamar a la integración para generar el PDF
        await generateTopConsumptionsReportPDF(limit, category);

        // Mostrar mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: 'Reporte generado',
            text: 'El reporte se ha descargado correctamente.',
            timer: 2000,
            showConfirmButton: false,
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });
    } catch (error) {
        console.error('Error al generar el reporte:', error);

        // Mostrar mensaje de error
        Swal.fire({
            icon: 'error',
            title: 'Error al generar el reporte',
            text: 'Ocurrió un problema al intentar generar el reporte. Por favor, inténtalo de nuevo.',
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });
    }
}

// Configurar el botón para generar el reporte
document.getElementById('topservicios').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevenir la acción predeterminada del botón
    await generateTopConsumptionsReport();
});
