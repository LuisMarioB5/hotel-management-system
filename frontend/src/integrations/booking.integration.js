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

function parseDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

function dateRangesOverlap(start1, end1, start2, end2) {
    // Convert all dates to timestamps for comparison
    const s1 = start1.getTime();
    const e1 = end1.getTime();
    const s2 = start2.getTime();
    const e2 = end2.getTime();
    return s1 < e2 && e1 > s2;
}

async function checkExistingReservations(roomId, checkInDate, checkOutDate) {
    try {
        const response = await fetch(`${BACKEND_ROUTES.bookings.getAll}`);
        
        if (!response.ok) {
            throw new Error('Error al verificar reservas existentes');
        }

        const allBookings = await response.json();

        console.log('All bookings:', allBookings);

        // First filter by roomId and active status
        const overlappingBookings = allBookings.filter(booking => {
            // Only check bookings for the same room
            if (booking.roomId !== roomId) {
                return false;
            }

            // Only check PENDIENTE or CONFIRMADA bookings
            if (booking.status.toUpperCase() !== 'PENDIENTE' && 
                booking.status.toUpperCase() !== 'CONFIRMADA') {
                return false;
            }

            // Use checkInDate and checkOutDate for comparison, not actual dates
            const bookingStart = parseDate(booking.checkInDate);
            const bookingEnd = parseDate(booking.checkOutDate);
            
            if (!bookingStart || !bookingEnd) {
                console.log('Invalid dates in booking:', booking);
                return false;
            }

            console.log('Comparing dates for roomId', roomId, ':', {
                newBooking: { 
                    start: checkInDate.toISOString(), 
                    end: checkOutDate.toISOString() 
                },
                existingBooking: { 
                    start: bookingStart.toISOString(), 
                    end: bookingEnd.toISOString() 
                }
            });

            return dateRangesOverlap(checkInDate, checkOutDate, bookingStart, bookingEnd);
        });

        console.log('Overlapping bookings for roomId', roomId, ':', overlappingBookings);

        return overlappingBookings;
    } catch (error) {
        console.error('Error al verificar reservas existentes:', error);
        throw error;
    }
}

export async function createBooking({ 
    customerId = null, 
    roomId = null, 
    checkInDate = null, 
    checkOutDate = null, 
    details = null,
    isActive = true,
    status = 'PENDIENTE',
    cashAdvance = 0,
    totalCost = 0,
    stayCost = 0,
    totalStayDays = 0
} = {}) {
    validateParamIsNotNull('customerId', customerId);
    validateParamIsNotNull('roomId', roomId);
    validateParamIsNotNull('checkInDate', checkInDate);
    validateParamIsNotNull('checkOutDate', checkOutDate);

    roomId = Number(roomId);

    const parsedCheckInDate = parseDate(checkInDate);
    const parsedCheckOutDate = parseDate(checkOutDate);

    if (!parsedCheckInDate || !parsedCheckOutDate) {
        throw new Error('Invalid date format');
    }

    console.log('Creating booking with parsed dates:', {
        checkInDate: parsedCheckInDate,
        checkOutDate: parsedCheckOutDate,
        roomId,
        cashAdvance,
        totalCost,
        stayCost,
        totalStayDays
    });

    try {
        const existingReservations = await checkExistingReservations(
            roomId,
            new Date(parsedCheckInDate),
            new Date(parsedCheckOutDate)
        );
        
        if (existingReservations.length > 0) {
            console.log('Overlapping bookings found:', existingReservations);
            return { 
                error: 'OVERLAPPING_BOOKINGS', 
                overlappingBookings: existingReservations.map(booking => ({
                    checkInDate: booking.checkInDate,
                    checkOutDate: booking.checkOutDate
                }))
            };
        }

        const body = { 
            customerId,
            roomId,
            checkInDate: parsedCheckInDate,
            checkOutDate: parsedCheckOutDate,
            details,
            isActive,
            status,
            cashAdvance,
            totalCost,
            stayCost,
            totalStayDays
        };

        const response = await fetch(BACKEND_ROUTES.bookings.create, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error en la respuesta del backend", errorData);
            throw new Error(errorData.message || 'Error al crear la reserva');
        }

        return await response.json();
    } catch (error) {
        console.error('Error de red:', error);
        throw error;
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
