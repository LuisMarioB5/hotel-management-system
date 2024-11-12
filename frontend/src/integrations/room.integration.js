import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { validateParamIsNotNull } from '../scripts/utils.js';

/**
 * Obtiene todas las habitaciones.
 * @async
 * @function getAllRooms
 * @returns {Promise<Object[]>} Una lista con las habitaciones en formato JSON.
 */
export async function getAllRooms() {
    try {
        const response = await fetch(BACKEND_ROUTES.rooms.getAll, {
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
 * Obtiene una habitación por su ID.
 * @async
 * @function getRoomById
 * @param {number} id - El ID de la habitación.
 * @returns {Promise<Object>} Los datos de la habitación en formato JSON.
 */
export async function getRoomById(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.rooms.getById(id), {
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
 * Obtiene una habitación por su número.
 * @async
 * @function getRoomByRoomNumber
 * @param {string} roomNumber - El número de la habitación.
 * @returns {Promise<Object>} Los datos de la habitación en formato JSON.
 */
export async function getRoomByRoomNumber(roomNumber) {
    validateParamIsNotNull('roomNumber', roomNumber);

    try {
        const response = await fetch(BACKEND_ROUTES.rooms.getByRoomNumber(roomNumber), {
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
 * Obtiene todas las habitaciones disponibles para reservar.
 * @async
 * @function getRoomsAvailable
 * @returns {Promise<Object[]>} Una lista con las habitaciones en formato JSON.
 */
export async function getRoomsAvailable() {

    try {
        const response = await fetch(BACKEND_ROUTES.rooms.getRoomsAvailable, {
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
 * Crea una nueva habitación.
 * @async
 * @function createRoom
 * @param {Object} params - Datos de la habitación.
 * @param {number} params.number - Número de habitación (requerido).
 * @param {string} params.floor - Piso de la habitación (requerido).
 * @param {string} params.type - Tipo o categoría de la habitación (requerido).
 * @param {number} params.price - Precio por noche de la habitación (requerido).
 * @param {string} [params.details] - Detalles o comentarios de la habitación.
 * @param {string} [params.status] - Estado actual de la habitación.
 * @param {boolean} [params.isAvailable] - Disponibilidad de la habitación.
 * @returns {Promise<Object>} Los datos de la habitación recién creado en formato JSON.
 */
export async function createRoom({ number = null, details = null, floor = null, type = null, status = null, price = null, isAvailable = null} = {}) {
    validateParamIsNotNull('number', number);
    validateParamIsNotNull('floor', floor);
    validateParamIsNotNull('type', type);
    validateParamIsNotNull('price', price);

    const body = { 
        number,
        floor: floor.toUpperCase(),
        type: type.toUpperCase(),
        price,
     };
    
     if(details !== null) body.details = details;
     if(status !== null) body.status = status.toUpperCase();
     if(isAvailable !== null) body.isAvailable = isAvailable;

    try {
        const response = await fetch(BACKEND_ROUTES.rooms.create, {
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
 * Actualiza los datos de una habitación.
 * @async
 * @function updateRoom
 * @param {Object} params - Datos de la habitación.
 * @param {number} params.id -ID de la habitación (requerido).
 * @param {number} [params.number] - Número de habitación.
 * @param {string} [params.floor] - Piso de la habitación.
 * @param {string} [params.type] - Tipo o categoría de la habitación.
 * @param {number} [params.price] - Precio por noche de la habitación.
 * @param {string} [params.details] - Detalles o comentarios de la habitación.
 * @param {string} [params.status] - Estado actual de la habitación.
 * @param {boolean} [params.isAvailable] - Disponibilidad de la habitación.
 * @returns {Promise<Object>} Los datos de la habitación actualizados en formato JSON.
 */
export async function updateRoom({ id = null, number = null, details = null, floor = null, type = null, status = null, price = null, isAvailable = null} = {}) {
    validateParamIsNotNull('id', id);

    const body = {};
     if(number !== null) body.number = number;
     if(floor !== null) body.floor = floor.toUpperCase();
     if(type !== null) body.type = type.toUpperCase();
     if(price !== null) body.price = price;
     if(details !== null) body.details = details;
     if(status !== null) body.status = status.toUpperCase();
     if(isAvailable !== null) body.isAvailable = isAvailable;

    try {
        const response = await fetch(BACKEND_ROUTES.rooms.update(id), {
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
 * Cambia el estado de la habitación a DISPONIBLE.
 * @async
 * @function changeRoomStatusToAvailable
 * @param {number} id -ID de la habitación.
 * @returns {Promise<Object>} Los datos de la habitación actualizados en formato JSON.
 */
export async function changeRoomStatusToAvailable(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.rooms.changeStatusToAvailable(id), {
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
 * Desactiva la disponibilidad de una habitación por su ID.
 * @async
 * @function updateRoomNotAvailable
 * @param {number} id - El ID de la habitación.
 */
export async function updateRoomNotAvailable(id) {
    validateParamIsNotNull('id', id);
    
    return await updateRoom({ id, isAvailable: false });
}

/**
 * Muestra todos los enums (variables constantes) que se emplean en la habitación.
 * @async
 * @function getRoomEnumsValues
 * @returns {Promise<Object>} Lista de los enums en formato JSON.
 */
export async function getRoomEnumsValues() {
    try {
        const response = await fetch(BACKEND_ROUTES.rooms.getEnumsValues, {
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
const roomDataRequired = {
    number: 202,
    floor: 'SEGUndO',
    type: 'doble',
    price: 2000,
};
const roomDataAll = {
    number: 101,
    details: 'Habitación con vista al mar',
    floor: 'PRIMER',
    type: 'MATRIMONIAL',
    status: 'Disponible',
    price: 15000,
    isAvailable: true
};
const updatedRoomData = {
    id: 7, // Se debe utilizar un id válido
    number: 303,
    details: 'Habitación sencilla para pasar la noche',
    floor: 'TERCER',
    type: 'INdividual',
    status: 'ocuPada',
    price: 900,
    isAvailable: false
}
    
// console.log(await getAllRooms());
// console.log(await getRoomById(1)); // Se debe utilizar un id válido
// console.log(await getRoomByRoomNumber(40)); // Se debe utilizar un nomber de habitación válido
// console.log(await createRoom(roomDataRequired));
// console.log(await createRoom(roomDataAll));
// console.log(await updateRoom(updatedRoomData));
// console.log(await notAvailableRoom(8)); // Se debe utilizar un id válido
console.log(await getRoomEnumsValues());
