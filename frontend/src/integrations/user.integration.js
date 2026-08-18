import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { validateParamIsNotNull } from '../scripts/utils.js';

/**
 * Obtiene todos los usuarios.
 * @async
 * @function getAllUsers
 * @returns {Promise<Object[]>} Una lista de usuarios en formato JSON.
 */
export async function getAllUsers() {
    try {
        const response = await fetch(BACKEND_ROUTES.users.getAll, {
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
 * Obtiene un usuario por su ID.
 * @async
 * @function getUserById
 * @param {number} id - El ID del usuario.
 * @returns {Promise<Object>} Los datos del usuario en formato JSON.
 */
export async function getUserById(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.users.getById(id), {
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
 * Obtiene un usuario por su nombre de usuario.
 * @async
 * @function getUserByUsername
 * @param {string} username - El nombre de usuario del usuario.
 * @returns {Promise<Object>} Los datos del usuario en formato JSON.
 */
export async function getUserByUsername(username) {
    validateParamIsNotNull('username', username);

    try {
        const response = await fetch(BACKEND_ROUTES.users.getByUsername(username), {
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
 * Crea un nuevo usuario.
 * @async
 * @function createUser
 * @param {Object} params - Datos del usuario.
 * @param {string} params.username - Nombre de usuario del usuario (requerido).
 * @param {string} params.password - Contraseña del usuario (requerido).
 * @param {string} params.role - Rol del usuario (requerido).
 * @param {boolean} [params.isActive] - Estado del usuario.
 * @returns {Promise<Object>} Los datos del usuario recién creado en formato JSON.
 */
export async function createUser({ username = null, password = null, role = null, isActive = null } = {}) {
    validateParamIsNotNull('username', username);
    validateParamIsNotNull('password', password);
    validateParamIsNotNull('role', role);

    const body = { username, password, role };
    body.isActive = isActive ?? true;

    try {
        const response = await fetch(BACKEND_ROUTES.users.create, {
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
 * Actualiza los datos de un usuario.
 * @async
 * @function updateUser
 * @param {Object} params - Datos del usuario.
 * @param {number} params.id -ID del usuario (requerido).
 * @param {string} [params.username] - Nombre de usuario del usuario.
 * @param {string} [params.password] - Contraseña del usuario.
 * @param {string} [params.role] - Rol del usuario.
 * @param {boolean} [params.isActive] - Estado del usuario.
 * @returns {Promise<Object>} Los datos del usuario actualizados en formato JSON.
 */
export async function updateUser({ id = null, username = null, password = null, role = null, isActive = null } = {}) {
    validateParamIsNotNull('id', id);

    const body = {};
    if (username !== null) body.username = username;
    if (password !== null) body.password = password;
    if (role !== null) body.role = role;
    if (isActive !== null) body.isActive = isActive;

    try {
        const response = await fetch(BACKEND_ROUTES.users.update(id), {
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
 * Elimina un usuario por su ID.
 * @async
 * @function deleteUser
 * @param {number} id - El ID del usuario.
 * @returns {Promise<Object>} Los datos de la operación de eliminación en formato JSON.
 */
export async function deleteUser(id) {
    validateParamIsNotNull('id', id);

    const response = await fetch(BACKEND_ROUTES.users.delete(id), {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar el usuario');
    }

    return await response.json();
}


/**
 * Muestra todos los enums (variables constantes) que se emplean en el usuario.
 * @async
 * @function getUserEnumsValues
 * @returns {Promise<Object>} Lista de los enums en formato JSON.
 */
export async function getUserEnumsValues() {
    try {
        const response = await fetch(BACKEND_ROUTES.users.getEnumsValues, {
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
