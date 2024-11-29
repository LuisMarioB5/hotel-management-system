import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { validateParamIsNotNull } from '../scripts/utils.js';

/**
 * Obtiene todas las facturas.
 * @async
 * @function getAllInvoices
 * @returns {Promise<Object[]>} Una lista con las facturas en formato JSON.
 */
export async function getAllInvoices() {
    try {
        const response = await fetch(BACKEND_ROUTES.billing.getAll, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error de red', error);
    }
}

/**
 * Obtiene una factura por su ID.
 * @async
 * @function getInvoiceById
 * @param {number} id - El ID de la factura.
 * @returns {Promise<Object>} Los datos de la factura en formato JSON.
 */
export async function getInvoiceById(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.billing.getById(id), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error de red', error);
    }
}

/**
 * Genera y descarga el PDF de una factura por su ID.
 * @async
 * @function generateInvoicePDF
 * @param {number} id - El ID de la factura (requerido).
 * @returns {Promise<Blob>} El archivo pdf en formato Blob listo para descargar.
 * @throws {error} Si ocurre algún error al generar o descargar el PDF.
 */
export async function generateInvoicePDF(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.billing.generatePDF(id), {
            method: 'GET',
            headers: {
                'Accept': 'application/pdf'
            },
        });

        // Verificar el estado de la respuesta
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error al generar el PDF:", errorText);
            throw new Error("No se pudo generar el PDF.");
        }

        // Obtener el archivo como Blob
        const blob = await response.blob();

        // Crear un enlace para descargar el archivo
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `factura_${id}.pdf`;
        link.click();

        // Limpiar el objeto URL creado
        URL.revokeObjectURL(link.href);

        return blob;
    } catch (error) {
        console.error("Error al intentar descargar el PDF:", error);
        throw error;
    }
}

/**
 * Obtiene los enums (variables constantes) de la factura
 * @async
 * @function getInvoiceEnums
 * @returns {Promise<Object[]>} Lista de los enums en formato JSON.
 */
export async function getInvoiceEnums() {

    try {
        const response = await fetch(BACKEND_ROUTES.billing.getEnumsValues(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error de red', error);
    }
}

/**
 * Crea una nueva factura.
 * @async
 * @function createInvoice
 * @param {Object} params - Datos de la factura.
 * @param {number} params.bookingId - ID de la reserva asociada (requerido).
 * @param {number} [params.customerId] - ID del cliente asociado (opcional).
 * @param {string} [params.invoiceType] - Tipo de factura ('CONTADO' o 'CREDITO') (opcional).
 * @param {string} [params.paymentStatus] - Estado del pago ('PENDIENTE' o 'PAGADO') (opcional).
 * @param {Array<Object>} [params.items] - Lista de ítems de la factura (opcional).
 * @param {string} params.items[].description - Descripción del ítem (requerido).
 * @param {number} params.items[].quantity - Cantidad del ítem (requerido).
 * @param {number} params.items[].unitPrice - Precio unitario del ítem (requerido).
 * @param {number} [params.items[].subtotal] - Subtotal del ítem (cantidad * precio unitario) (opcional).
 * @param {string} [params.items[].date] - Fecha del ítem (opcional).
 * @param {string} [params.items[].type] - Tipo del ítem ('ESTANCIA', 'CONSUMO', 'PENALIDAD') (opcional).
 * @returns {Promise<Object>} Los datos de la factura recién creada en formato JSON.
 */
export async function createInvoice({
    bookingId = null,
    customerId = null,
    invoiceType = null,
    paymentStatus = null,
    items = []
} = {}) {
    // Validar parámetros obligatorios
    validateParamIsNotNull('bookingId', bookingId);
    if (typeof bookingId !== 'number') {
        throw new TypeError('bookingId debe ser un número.');
    }

    // Construir lista de ítems validada
    const validatedItems = items.length > 0
        ? items.map((item, index) => {
            validateParamIsNotNull(`items[${index}].description`, item.description);
            validateParamIsNotNull(`items[${index}].quantity`, item.quantity);
            validateParamIsNotNull(`items[${index}].unitPrice`, item.unitPrice);

            return {
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal ?? item.quantity * item.unitPrice,
                date: item.date ?? new Date().toISOString(), // Fecha actual si no se proporciona
                type: item.type ?? 'PENALIDAD', // Valor por defecto
            };
        })
        : undefined;

    // Construir el cuerpo de la solicitud
    const body = {
        bookingId,
        ...(customerId && { customerId }),
        ...(invoiceType && { invoiceType }),
        ...(paymentStatus && { paymentStatus }),
        ...(validatedItems && { items: validatedItems }),
    };

    try {
        const response = await fetch(BACKEND_ROUTES.billing.create, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            return await response.json();
        } else {
            console.error("Error en la respuesta del backend:", await response.text());
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
}

/**
 * Actualiza el estado del pago de la factura.
 * @async
 * @function updateInvoicePaymentStatus
 * @param {number} id - ID de la factura (requerido).
 * @param {string} status - Estado del pago (PENDIENTE o PAGADA) a colocarle a la factura.
 * @returns {Promise<Object>} Los datos de la factura actualizados en formato JSON.
 */
export async function updateInvoicePaymentStatus(id, status) {
    validateParamIsNotNull('id', id);
    validateParamIsNotNull('status', status);

    const body = {
        paymentStatus: status,
    };

    try {
        const response = await fetch(BACKEND_ROUTES.billing.update(id), {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error de red', error);
    }
}

/**
 * Desactiva una factura por su ID.
 * @async
 * @function disableInvoice
 * @param {number} id - El ID de la factura.
 */
export async function disableInvoice(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.billing.disable(id), {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error de red', error);
    }
}
