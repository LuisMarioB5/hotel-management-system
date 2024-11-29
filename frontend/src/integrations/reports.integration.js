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
        console.error("Error al intentar descargar el PDF:", error);
        throw error;
    }
}

/**
 * Genera y descarga un reporte en formato PDF de los productos que ofrece el hotel.
 * @async
 * @function generateProductsOfferedReportPDF
 * @param {number} isActive - El estado de los productos ['true', 'false', 'Activo', 'Inactivo', 'Todos'] (requerido).
 * @param {number} category - Categoria por la que filtrar ['PRODUCTO', 'SERVICIO', 'Todos'] (requerido).
 * @returns {Promise<Blob>} El archivo pdf en formato Blob listo para descargar.
 * @throws {error} Si ocurre algún error al generar o descargar el PDF.
 */
export async function generateProductsOfferedReportPDF(isActive, category) {
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
        console.error("Error al intentar descargar el PDF:", error);
        throw error;
    }
}
