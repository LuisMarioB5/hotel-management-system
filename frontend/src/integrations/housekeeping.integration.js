import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { validateParamIsNotNull } from '../scripts/utils.js';

/**
 * Obtiene todas las tareas de mantenimiento/limpieza, opcionalmente filtradas.
 * @async
 * @function getAllTasks
 * @param {Object} [filters] - Filtros opcionales: status, type, roomId, assignedToId.
 * @returns {Promise<Object[]>} Una lista de tareas en formato JSON.
 */
export async function getAllTasks(filters = {}) {
    try {
        const response = await fetch(BACKEND_ROUTES.housekeeping.getAll(filters), {
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
 * Crea una nueva tarea de limpieza o mantenimiento (reporte de incidencia).
 * @async
 * @function createTask
 * @param {Object} params - Datos de la tarea.
 * @param {number} params.roomId - ID de la habitación (requerido).
 * @param {string} params.type - Tipo de tarea: LIMPIEZA o MANTENIMIENTO (requerido).
 * @param {string} [params.priority] - Prioridad: BAJA, MEDIA o ALTA.
 * @param {string} [params.description] - Descripción de la tarea o incidencia.
 * @param {number} [params.assignedToId] - ID del usuario asignado.
 * @param {number} [params.createdById] - ID del usuario que reporta la tarea.
 * @returns {Promise<Object>} La tarea creada en formato JSON.
 */
export async function createTask({ roomId = null, type = null, priority = null, description = null, assignedToId = null, createdById = null } = {}) {
    validateParamIsNotNull('roomId', roomId);
    validateParamIsNotNull('type', type);

    const body = { roomId, type };
    if (priority !== null) body.priority = priority;
    if (description !== null) body.description = description;
    if (assignedToId !== null) body.assignedToId = assignedToId;
    if (createdById !== null) body.createdById = createdById;

    try {
        const response = await fetch(BACKEND_ROUTES.housekeeping.create, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            return await response.json();
        } else {
            console.error('Error en la respuesta del backend', await response.text());
        }
    } catch (error) {
        console.error('Error de red', error);
    }
}

/**
 * Asigna una tarea a un usuario.
 * @async
 * @function assignTask
 * @param {number} id - ID de la tarea.
 * @param {number} userId - ID del usuario a asignar.
 * @returns {Promise<Object>} La tarea actualizada en formato JSON.
 */
export async function assignTask(id, userId) {
    validateParamIsNotNull('id', id);
    validateParamIsNotNull('userId', userId);

    try {
        const response = await fetch(BACKEND_ROUTES.housekeeping.assign(id), {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId }),
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error de red', error);
    }
}

/**
 * Marca una tarea como iniciada (En proceso).
 * @async
 * @function startTask
 * @param {number} id - ID de la tarea.
 * @returns {Promise<Object>} La tarea actualizada en formato JSON.
 */
export async function startTask(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.housekeeping.start(id), {
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
 * Marca una tarea como completada.
 * @async
 * @function completeTask
 * @param {number} id - ID de la tarea.
 * @returns {Promise<Object>} La tarea actualizada en formato JSON.
 */
export async function completeTask(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.housekeeping.complete(id), {
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
 * Cancela una tarea.
 * @async
 * @function cancelTask
 * @param {number} id - ID de la tarea.
 * @returns {Promise<Object>} La tarea actualizada en formato JSON.
 */
export async function cancelTask(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.housekeeping.cancel(id), {
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
 * Muestra todos los enums (variables constantes) que se emplean en las tareas.
 * @async
 * @function getTaskEnumsValues
 * @returns {Promise<Object>} Lista de los enums en formato JSON.
 */
export async function getTaskEnumsValues() {
    try {
        const response = await fetch(BACKEND_ROUTES.housekeeping.getEnumsValues, {
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
