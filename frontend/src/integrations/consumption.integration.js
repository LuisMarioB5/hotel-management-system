import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { validateParamIsNotNull } from '../scripts/utils.js';

/**
 * Obtiene todos los consumos.
 * @async
 * @function getAllConsumptions
 * @returns {Promise<Object[]>} Una lista con los consumos en formato JSON.
 */
export async function getAllConsumptions() {
    try {
        const response = await fetch(BACKEND_ROUTES.consumptions.getAll, {
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
 * Obtiene un consumo por su ID.
 * @async
 * @function getConsumptionById
 * @param {number} id - El ID del consumo.
 * @returns {Promise<Object>} Los datos del consumo en formato JSON.
 */
export async function getConsumptionById(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.consumptions.getById(id), {
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
 * Obtiene los consumos de una reserva en especifico
 * @async
 * @function getConsumptionByBookingId
 * @param {number} bookingId - El ID de la reserva vinculada al consumo.
 * @returns {Promise<Object[]>} Lista de los consumos en formato JSON.
 */
export async function getConsumptionByBookingId(bookingId) {
    validateParamIsNotNull('bookingId', bookingId);

    try {
        const response = await fetch(BACKEND_ROUTES.consumptions.getByBookingId(bookingId), {
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
 * Crea un nuevo consumo.
 * @async
 * @function createConsumption
 * @param {Object} params - Datos del consumo.
 * @param {number} params.bookingId - ID de la reserva vinculada al consumo (requerido).
 * @param {number} params.productId - ID del producto a ser consumido (requerido).
 * @param {number} params.quantity - Cantidad del consumo (requerido).
 * @param {string} params.availability - Disponibilidad del consumo {PENDIENTE o SEPARADO} (requerido).
 * @returns {Promise<Object>} Los datos del consumo recién creado en formato JSON.
 */
export async function createConsumption({ bookingId = null, productId = null, quantity = null, availability = null} = {}) {
    validateParamIsNotNull('bookingId', bookingId);
    validateParamIsNotNull('productId', productId);
    validateParamIsNotNull('quantity', quantity);
    validateParamIsNotNull('availability', availability);

    const body = { 
        bookingId,
        productId,
        quantity,
        availability
     };

    try {
        const response = await fetch(BACKEND_ROUTES.consumptions.add, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            return await response.json();
        } else {
            console.error("Error en la respuesta del backend", await response.text());
        }
    } catch (error) {
        console.error('Error de red', error);
    }
}

/**
 * Actualiza la disponibilidad o la cantidad de un producto a consumir.
 * @async
 * @function updateConsumption
 * @param {Object} params - Datos del consumo.
 * @param {number} params.id - ID del consumo (requerido).
 * @param {number} [params.quantity] - Nueva cantidad del producto a consumir.
 * @param {string} [params.availability] - Disponibilidad del consumo {PENDIENTE o SEPARADO}.
 * @returns {Promise<Object>} Los datos del consumo actualizados en formato JSON.
 */
export async function updateConsumption({id = null, quantity = null, availability = null} = null) {
    validateParamIsNotNull('id', id);

    const body = {};
    if(quantity) body.quantity = quantity;
    if(availability) body.availability = availability;

    try {
        const response = await fetch(BACKEND_ROUTES.consumptions.update(id), {
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
 * Elimina un consumo por su ID.
 * @async
 * @function deleteConsumption
 * @param {number} id - El ID del consumo.
 */
export async function deleteConsumption(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.consumptions.delete(id), {
            method: 'DELETE',
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
