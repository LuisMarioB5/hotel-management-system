import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { validateParamIsNotNull } from '../scripts/utils.js'

/**
 * Genera y descarga un reporte en formato PDF de los consumos de una reserva por el ID de la reserva.
 * @async
 * @function generateConsumptionsReportPDF
 * @param {number} id - El ID de la reserva (requerido).
 * @returns {Promise<Blob>} El archivo pdf en formato Blob listo para descargar.
 * @throws {error} Si ocurre algún error al generar o descargar el PDF.
 */
export async function generateConsumptionsReportPDF(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.reports.generateConsumptions(id), {
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
        link.download = `reporte_de_consumos_${id}.pdf`;
        link.click();

        // Limpiar el objeto URL creado
        URL.revokeObjectURL(link.href);

        return blob;
    } catch (error) {
        console.error("generateConsumptionsReportPDF | Error al intentar descargar el PDF:", error);
        throw error;
    }
}

/**
 * @deprecated
 * Genera y descarga un reporte en formato PDF de los productos que ofrece el hotel.
 * @async
 * @function generateProductsOfferedReportPDF
 * @param {boolean} isActive - El estado de los productos ['true', 'false', 'Activo', 'Inactivo', 'Todos'] (requerido).
 * @param {string} category - Categoria por la que filtrar ['PRODUCTO', 'SERVICIO', 'Todos'] (requerido).
 * @returns {Promise<Blob>} El archivo pdf en formato Blob listo para descargar.
 * @throws {error} Si ocurre algún error al generar o descargar el PDF.
 */
export async function generateProductsOfferedReportPDF(isActive, category) {
    validateParamIsNotNull('isActive', isActive);
    validateParamIsNotNull('category', category);

    try {
        const response = await fetch(BACKEND_ROUTES.reports.generateProductsOffered(isActive, category), {
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
        link.download = `reporte_de_productos_ofrecidos.pdf`;
        link.click();

        // Limpiar el objeto URL creado
        URL.revokeObjectURL(link.href);

        return blob;
    } catch (error) {
        console.error("generateProductsOfferedReportPDF | Error al intentar descargar el PDF:", error);
        throw error;
    }
}

/**
 * @async
 * @function generateBookingsByRoomReportPDF
 * @description Genera y descarga un reporte en formato PDF de las reservas que tiene una habitación en un periodo de tiempo.
 * Las fechas fueron probadas para ser enviadas en formato: MM/dd/yyyy
 * @param {number} roomId - ID de la habitación (requerido).
 * @param {string} checkInDate - Fecha inicial del periodo de busqueda (requerido).
 * @param {string} [checkOutDate] - Fecha final del periodo de busqueda, en caso de no ingresar se utiliza la fecha actual en zona horaria UTC.
 * @returns {Promise<Blob>} El archivo pdf en formato Blob listo para descargar.
 * @throws {error} Si ocurre algún error al generar o descargar el PDF.
 */
export async function generateBookingsByRoomReportPDF(roomId, checkInDate, checkOutDate) {
    validateParamIsNotNull('roomId', roomId);
    validateParamIsNotNull('checkInDate', checkInDate);
    try {
        const response = await fetch(BACKEND_ROUTES.reports.generateBookingsByRoom(roomId, checkInDate, checkOutDate), {
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
        link.download = `reporte_de_rerservas_por_habitacion.pdf`;
        link.click();

        // Limpiar el objeto URL creado
        URL.revokeObjectURL(link.href);

        return blob;
    } catch (error) {
        console.error("generateBookingsByRoomReportPDF | Error al intentar descargar el PDF:", error);
        throw error;
    }
}

/**
 * @async
 * @function generateTopConsumptionsReportPDF
 * @description Genera y descarga un reporte en formato PDF del top (limit) consumos, con filtro por categoria.
 * Las fechas fueron probadas para ser enviadas en formato: MM/dd/yyyy
 * @param {number} limit - Limite para realizar el top de consumos (requerido).
  * @param {string} [category] - Categoria por la que filtrar ['PRODUCTO', 'SERVICIO', 'Todos'] (no requerido, tomaría Todos por defecto).
 * @returns {Promise<Blob>} El archivo pdf en formato Blob listo para descargar.
 * @throws {error} Si ocurre algún error al generar o descargar el PDF.
 */
export async function generateTopConsumptionsReportPDF(limit, category) {
    validateParamIsNotNull('limit', limit);
    try {
        const response = await fetch(BACKEND_ROUTES.reports.generateTopConsumptions(limit, category), {
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
        link.download = `reporte_del_top_consumos.pdf`;
        link.click();

        // Limpiar el objeto URL creado
        URL.revokeObjectURL(link.href);

        return blob;
    } catch (error) {
        console.error("generateTopConsumptionsReportPDF | Error al intentar descargar el PDF:", error);
        throw error;
    }
}
