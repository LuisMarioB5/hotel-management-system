import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { validateParamIsNotNull } from '../scripts/utils.js';

/**
 * Obtiene todas las reservas.
 * @async
 * @function getAllBookings
 * @returns {Promise<Object[]>} Una lista con las reservas en formato JSON.
 */
export async function getAllBookings() {
    try {
        const response = await fetch(BACKEND_ROUTES.bookings.getAll, {
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
 * Obtiene una reserva por su ID.
 * @async
 * @function getBookingById
 * @param {number} id - El ID de la reserva.
 * @returns {Promise<Object>} Los datos de la reserva en formato JSON.
 */
export async function getBookingById(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.bookings.getById(id), {
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
 * Crea una nueva reserva.
 * @async
 * @function createBooking
 * @param {Object} params - Datos de la reserva.
 * @param {number} params.customerId - ID del cliente vinculado a la reserva (requerido).
 * @param {number} params.roomId - ID de la habitación vinculada a la reserva (requerido).
 * @param {Date} params.checkInDate - Fecha en la que se espera iniciar la estadía (requerido).
 * @param {Date} params.checkOutDate - Fecha en la que se espera concluir la estadía (requerido).
 * @param {string} [params.details] - Detalles relacionados a la reserva.
 * @returns {Promise<Object>} Los datos de la reserva recién creada en formato JSON.
 */
export async function createBooking({ customerId = null, roomId = null, checkInDate = null, checkOutDate = null, details = null} = {}) {
    validateParamIsNotNull('customerId', customerId);
    validateParamIsNotNull('roomId', roomId);
    validateParamIsNotNull('checkInDate', checkInDate);
    validateParamIsNotNull('checkOutDate', checkOutDate);

    const body = { 
        customerId,
        roomId,
        checkInDate,
        checkOutDate
     };
    
     if(details !== null) body.details = details;

    try {
        const response = await fetch(BACKEND_ROUTES.bookings.create, {
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
 * Actualiza los datos de una reserva.
 * @async
 * @function updateBooking
 * @param {Object} params - Datos de la reserva.
 * @param {number} params.id -ID de la reserva (requerido).
 * @param {number} [params.roomId] - ID de la habitación vinculada a la reserva.
 * @param {Date} [params.checkInDate] - Fecha en la que se espera iniciar la estadía.
 * @param {Date} [params.checkOutDate] - Fecha en la que se espera concluir la estadía.
 * @param {string} [params.details] - Detalles relacionados a la reserva.
 * @returns {Promise<Object>} Los datos de la reserva actualizados en formato JSON.
 */
export async function updateBooking({ id = null, customerId = null, roomId = null, checkInDate = null, checkOutDate = null, details = null} = {}) {
    validateParamIsNotNull('id', id);

    const body = {};
    if(roomId !== null) body.roomId = roomId;
    if(checkInDate !== null) body.checkInDate = checkInDate;
    if(checkOutDate !== null) body.checkOutDate = checkOutDate;
    if(details !== null) body.details = details;

    try {
        const response = await fetch(BACKEND_ROUTES.bookings.update(id), {
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
 * Desactiva una reserva por su ID.
 * @async
 * @function desactiveBooking
 * @param {number} id - El ID de la reserva.
 */
export async function desactiveBooking(id) {
    validateParamIsNotNull('id', id);
    
    try {
        const response = await fetch(BACKEND_ROUTES.bookings.desactive(id), {
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

/**
 * Confirma una reserva por su ID.
 * @async
 * @function confirmBooking
 * @param {number} id - El ID de la reserva.
 */
export async function confirmBooking(id) {
    validateParamIsNotNull('id', id);
    
    try {
        const response = await fetch(BACKEND_ROUTES.bookings.confirm(id), {
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

/**
 * Cancela una reserva por su ID.
 * @async
 * @function cancelBooking
 * @param {number} id - El ID de la reserva.
 */
export async function cancelBooking(id) {
    validateParamIsNotNull('id', id);
    
    try {
        const response = await fetch(BACKEND_ROUTES.bookings.cancel(id), {
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

/**
 * Realiza el check-in (entrada o inicio) de una reserva por su ID.
 * @async
 * @function checkInBooking
 * @param {number} id - El ID de la reserva.
 * @param {number} cashAdvance - El adelanto que se debe depositar para iniciar la estadía.
 */
export async function checkInBooking(id, cashAdvance) {
    validateParamIsNotNull('id', id);
    validateParamIsNotNull('cashAdvance', cashAdvance);
    
    const body = {
        cashAdvance,
    };

    try {
        const response = await fetch(BACKEND_ROUTES.bookings.checkIn(id), {
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
 * Realiza el check-out (salida o finalización) de una reserva por su ID.
 * @async
 * @function checkOutBooking
 * @param {number} id - El ID de la reserva.
 */
export async function checkOutBooking(id) {
    validateParamIsNotNull('id', id);
    
    try {
        const response = await fetch(BACKEND_ROUTES.bookings.checkOut(id), {
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

/**
 * Muestra todos los enums (variables constantes) que se emplean en la reserva.
 * @async
 * @function getBookingEnumsValues
 * @returns {Promise<Object>} Lista de los enums en formato JSON.
 */
export async function getBookingEnumsValues() {
    try {
        const response = await fetch(BACKEND_ROUTES.bookings.getEnumsValues, {
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

/* PRUEBAS DE LOS METODOS PARA LA CRUD DE LAS HABITACIONES (Rooms) */
const bookingDataRequired = {
    customerId: 8,
    roomId: 9,
    checkInDate: '2024-11-17T12:00Z',
    checkOutDate: '2024-11-18T14:00Z',
};
const bookingDataAll = {
    customerId: 6,
    roomId: 7,
    checkInDate: '2024-11-18T12:00Z',
    checkOutDate: '2024-11-19T14:00Z',
    details: 'Ojo con la persona parece sospechosa'
};
const updatedBookingData = {
    id: 17, // Se debe utilizar un id válido
    roomId: 8,
    checkInDate: '2024-11-20T12:00Z',
    checkOutDate: '2024-11-22T14:00Z',
    details: 'Se actualizaron los datos de la habitación'
}

console.log(await getAllBookings());
// console.log(await getBookingById(2)); // Se debe utilizar un id válido
// console.log(await createBooking(bookingDataRequired));
// console.log(await createBooking(bookingDataAll));
// console.log(await updateBooking(updatedBookingData));
// console.log(await desactiveBooking(8)); // Se debe utilizar un id válido
// console.log(await confirmBooking(18));
// console.log(await checkInBooking(18, 1000));
// console.log(await checkOutBooking(18));
// console.log(await cancelBooking(19));
// console.log(await getBookingEnumsValues());
