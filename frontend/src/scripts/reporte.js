import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { validateParamIsNotNull } from '../scripts/utils.js';
import { getAllBookings } from '../integrations/booking.integration.js';
import { generateConsumptionsReportPDF, generateBookingsByRoomReportPDF, generateTopConsumptionsReportPDF  } from '../integrations/reports.integration.js';
import { getAllRooms } from '../integrations/room.integration.js';

// Acceso perezoso a jsPDF: si se leyera en el nivel superior del módulo y
// el script de jsPDF (cargado con `defer`) aún no estuviera listo, esta línea
// lanzaría una excepción que abortaría TODO el módulo, incluyendo el listener
// del botón de búsqueda de habitaciones más abajo.
function getJsPDF() {
    return window.jspdf.jsPDF;
}

// Variable para evitar múltiples ejecuciones
let isGeneratingReport = false;

// Función global para descargar el reporte de productos/servicios
window.downloadProductsReportPDF = async function (status, category) {
    validateParamIsNotNull('status', status);
    validateParamIsNotNull('category', category);

    if (isGeneratingReport) return; // Salir si ya se está generando un reporte
    isGeneratingReport = true; // Marcar el inicio del proceso

    try {
       
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

        const doc = new (getJsPDF())();

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

// Nota: la descarga de productos/servicios se dispara directamente desde el
// botón en el HTML vía onclick="downloadProductsReportPDF(...)", así que no
// se necesita un listener aparte aquí. (Antes había uno enganchado a
// `.downloadproduct-btn`, una clase que ya no existe en el HTML rediseñado;
// eso hacía que `querySelector(...)` devolviera `null` y el
// `.addEventListener` sobre `null` abortara la carga de TODO este módulo,
// incluyendo la exposición de `showRoomSelectionAlert`/
// `openReservationSearchModal` más abajo — esa era la causa real de que los
// botones de búsqueda no hicieran nada.)


// Cache de reservas CHECKED_OUT para que el botón de búsqueda pueda abrir
// la alerta directamente vía onclick, sin depender de que un addEventListener
// se haya registrado a tiempo (más robusto que engancharlo solo una vez).
let cachedCheckedOutBookings = [];

/**
 * Carga los IDs de las reservas con estado CHECKED_OUT en el `<select>` de reservas.
 */
export async function loadReservationIDs() {
    const select = document.getElementById('reservation-select');

    try {
        const bookings = await getAllBookings();
        const checkedOutBookings = bookings.filter(booking => booking.status === 'CHECKED_OUT');
        cachedCheckedOutBookings = checkedOutBookings;

        // Limpiar el select antes de llenarlo
        select.innerHTML = '<option value="">Seleccione una reserva</option>';

        // Agregar las reservas al select
        checkedOutBookings.forEach(booking => {
            const option = document.createElement('option');
            option.value = booking.id;
            option.textContent = `Reserva ${booking.id}`;
            select.appendChild(option);
        });
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
 * Abre la alerta de selección de reserva. Expuesta globalmente y enganchada
 * vía `onclick` en el HTML para no depender del orden/momento en que se
 * ejecutan los módulos.
 */
window.openReservationSearchModal = async function () {
    if (cachedCheckedOutBookings.length === 0) {
        await Swal.fire({
            icon: 'info',
            title: 'No hay reservas',
            text: 'Actualmente no hay reservas en estado CHECKED_OUT.',
        });
        return;
    }

    await showReservationSelectionAlert(cachedCheckedOutBookings);
};

/**
 * Muestra una alerta con todas las reservas en CHECKED_OUT.
 * Al hacer clic en una reserva, selecciona automáticamente esa opción en el `<select>`.
 * @param {Array} bookings - Lista de reservas en estado CHECKED_OUT.
 */
async function showReservationSelectionAlert(bookings) {
    const reservationList = bookings
        .map(booking => {
            const customerName = booking.customer?.name || 'Sin nombre';
            const roomNumber = booking.room?.number ?? '—';
            const checkIn = booking.checkInDate
                ? new Date(booking.checkInDate).toLocaleDateString('es-ES')
                : '';
            const searchTerms = `${customerName} ${booking.id} ${roomNumber}`.toLowerCase();

            return `<div class="reservation-item" data-search="${searchTerms}" onclick="selectReservation(${booking.id})">
                    <div class="reservation-item-icon"><i class="fas fa-calendar-check"></i></div>
                    <div class="reservation-item-body">
                        <span class="reservation-item-title">Reserva ${booking.id} · Hab. ${roomNumber}</span>
                        <span class="reservation-item-subtitle">${customerName}${checkIn ? ' · ' + checkIn : ''}</span>
                    </div>
                    <i class="fas fa-chevron-right reservation-item-arrow"></i>
                </div>`;
        })
        .join('');

    await Swal.fire({
        title: 'Selecciona una reserva',
        html: `
            <div class="reservation-search-wrap">
                <i class="fas fa-search"></i>
                <input type="text" id="reservationSearchInput" placeholder="Buscar por cliente, habitación o # de reserva..." autocomplete="off">
            </div>
            <div class="reservation-list" id="reservationListContainer">${reservationList}</div>
            <p class="reservation-empty-msg" id="reservationEmptyMsg" style="display: none;">No se encontraron reservas.</p>
        `,
        showConfirmButton: false, // No mostrar botón de confirmar
        heightAuto: false,
        customClass: {
            container: 'swal-container',
            popup: 'swal-popup',
        },
        didOpen: () => {
            const input = document.getElementById('reservationSearchInput');
            const items = Array.from(document.querySelectorAll('#reservationListContainer .reservation-item'));
            const emptyMsg = document.getElementById('reservationEmptyMsg');

            input.focus();
            input.addEventListener('input', () => {
                const term = input.value.trim().toLowerCase();
                let visibleCount = 0;

                items.forEach(item => {
                    const matches = item.dataset.search.includes(term);
                    item.style.display = matches ? '' : 'none';
                    if (matches) visibleCount++;
                });

                emptyMsg.style.display = visibleCount === 0 ? 'block' : 'none';
            });
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
    // (id legado que ya no existe en la página; se protege para no romper
    // el resto de la configuración de botones si falta en el DOM)
    if (downloadProductsButton) {
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
}
// El botón de búsqueda ahora usa la clase .panel-icon-btn definida en
// recepcion.css (compartida con el resto del sitio), en vez de un estilo
// inyectado aquí.

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

        // Limpiar el select antes de llenarlo. "Todos" queda seleccionado por
        // defecto: si no se elige una habitación específica, el reporte trae
        // las reservas de todas las habitaciones en el rango de fechas.
        select.innerHTML = '<option value="all">Todos</option>';

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

        // Generar las habitaciones en una cuadrícula responsiva
        const roomList = rooms
            .map(
                room =>
                    `<div
                        class="room-item"
                        onclick="selectRoom(${room.id}, '${room.number}')">
                        <i class="fas fa-door-closed"></i> Habitación ${room.number}
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

// Expuesta globalmente y enganchada vía `onclick` en el HTML: más robusta
// que un addEventListener que depende del orden/momento de ejecución de los
// módulos.
window.showRoomSelectionAlert = showRoomSelectionAlert;

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
    const [year, month, day] = date.split('-'); // Dividir la fecha en componentes
    return `${month}/${day}/${year}`; // Reorganizar en formato MM/dd/yyyy
}

// Función para generar el reporte usando el ID de la habitación seleccionada.
// Si no se eligió una habitación específica (roomId vacío), se genera el
// reporte para todas las habitaciones en el rango de fechas.
window.generateRoomReport = async function () {
    const roomId = document.getElementById('room-id-hidden').value || 'all';

    const startDate = document.getElementById('fechaEntrada').value;
    const endDate = document.getElementById('fechaSalida').value;

    if (!startDate || !endDate) {
        await Swal.fire({
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

    // Formatear las fechas directamente
    const formattedStartDate = formatDateToMMDDYYYY(startDate);
    const formattedEndDate = formatDateToMMDDYYYY(endDate);

    try {
        // Llamar a la función para generar el PDF del reporte
        await generateBookingsByRoomReportPDF(roomId, formattedStartDate, formattedEndDate);

        // Mostrar mensaje de éxito
        await Swal.fire({
            icon: 'success',
            title: 'Reporte generado',
            text: 'El reporte se descargó correctamente.',
            timer: 2000,
            showConfirmButton: false,
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });

        console.log(
            `Generando reporte para la habitación con ID ${roomId} desde ${formattedStartDate} hasta ${formattedEndDate}`
        );
    } catch (error) {
        console.error('Error al generar el reporte:', error);

        // Mostrar mensaje de error
        await Swal.fire({
            icon: 'error',
            title: 'Error al generar el reporte',
            text: 'Ocurrió un problema al intentar generar el reporte. Por favor, inténtalo nuevamente.',
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });
    }
};
// El estilo de `.room-grid` / `.room-item` (y del resto de los modales de
// búsqueda) vive en recepcion.css para que respete el tema claro/oscuro del
// sitio, en vez de inyectarse aquí como CSS plano.

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
