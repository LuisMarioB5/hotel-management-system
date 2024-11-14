import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { validateParamIsNotNull } from '../scripts/utils.js';

/**
 * Obtiene todos los consumos.
 * @async
 * @function getAllProducts
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
 * @function createProduct
 * @param {Object} params - Datos del consumo.
 * @param {number} params.bookingId - ID de la reserva vinculada al consumo (requerido).
 * @param {number} params.productID - ID del producto a ser consumido (requerido).
 * @param {number} params.quantity - Cantidad del consumo (requerido).
 * @returns {Promise<Object>} Los datos del consumo recién creado en formato JSON.
 */
export async function createProduct({ bookingId = null, productID = null, quantity = null} = {}) {
    validateParamIsNotNull('bookingId', bookingId);
    validateParamIsNotNull('productID', productID);
    validateParamIsNotNull('quantity', quantity);

    const body = { 
        bookingId,
        productID,
        quantity
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
 * Actualiza la cantidad de un producto a consumir.
 * @async
 * @function updateProduct
 * @param {number} id - ID del consumo.
 * @param {number} quantity - Nueva cantidad del producto a consumir.
 * @returns {Promise<Object>} Los datos del consumo actualizados en formato JSON.
 */
export async function updateProduct(id, quantity) {
    validateParamIsNotNull('id', id);
    validateParamIsNotNull('quantity', quantity);

    const body = {quantity};

    try {
        const response = await fetch(BACKEND_ROUTES.consumptions.updateQuantity(id), {
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
 * @function deleteProduct
 * @param {number} id - El ID del consumo.
 */
export async function deleteProduct(id) {
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
