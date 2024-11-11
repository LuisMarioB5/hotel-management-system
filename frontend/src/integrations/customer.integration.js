import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { validateParamIsNotNull } from '../scripts/utils.js';

/**
 * Obtiene todos los clientes.
 * @async
 * @function getAllCustomers
 * @returns {Promise<Object[]>} Una lista de clientes en formato JSON.
 */
export async function getAllCustomers() {
    try {
        const response = await fetch(BACKEND_ROUTES.customers.getAll, {
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
 * Obtiene un cliente por su ID.
 * @async
 * @function getCustomerById
 * @param {number} id - El ID del cliente.
 * @returns {Promise<Object>} Los datos del cliente en formato JSON.
 */
export async function getCustomerById(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.customers.getById(id), {
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
 * Obtiene un cliente por su número de documento.
 * @async
 * @function getCustomerByDocumentNumber
 * @param {string} documentNumber - El número de documento del cliente.
 * @returns {Promise<Object>} Los datos del cliente en formato JSON.
 */
export async function getCustomerByDocumentNumber(documentNumber) {
    validateParamIsNotNull('documentNumber', documentNumber);

    try {
        const response = await fetch(BACKEND_ROUTES.customers.getByDocumentNumber(documentNumber), {
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
 * Crea un nuevo cliente.
 * @async
 * @function createCustomer
 * @param {Object} params - Datos del cliente.
 * @param {string} params.name - Nombre del cliente (requerido).
 * @param {string} params.lastName - Apellido del cliente (requerido).
 * @param {string} params.documentType - Tipo de documento (requerido).
 * @param {string} params.documentNumber - Número de documento (requerido).
 * @param {string} params.email - Correo electrónico del cliente (requerido).
 * @param {string} [params.gender] - Género del cliente.
 * @param {string} [params.phoneNumber] - Teléfono del cliente.
 * @param {string} [params.address] - Dirección del cliente.
 * @param {boolean} [params.isFrequentGuest] - Si es huésped frecuente.
 * @param {string} [params.notes] - Notas adicionales.
 * @param {boolean} [params.isActive] - Estado activo/inactivo del cliente.
 * @returns {Promise<Object>} Los datos del cliente recién creado en formato JSON.
 */
export async function createCustomer({ name = null, lastName = null, documentType = null, documentNumber = null, email = null, gender = null, phoneNumber = null, address = null, isFrequentGuest = null, notes = null, isActive = null } = {}) {
    validateParamIsNotNull('name', name);
    validateParamIsNotNull('lastName', lastName);
    validateParamIsNotNull('documentType', documentType);
    validateParamIsNotNull('documentNumber', documentNumber);
    validateParamIsNotNull('email', email);

    const body = { name, lastName, documentType, documentNumber, email };
    if (gender !== null) body.gender = gender;
    if (phoneNumber !== null) body.phoneNumber = phoneNumber;
    if (address !== null) body.address = address;
    if (isFrequentGuest !== null) body.isFrequentGuest = isFrequentGuest;
    if (notes !== null) body.notes = notes;
    if (isActive !== null) body.isActive = isActive;

    try {
        const response = await fetch(BACKEND_ROUTES.customers.create, {
            method: 'POST',
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
 * Actualiza los datos de un cliente.
 * @async
 * @function updateCustomer
 * @param {Object} params - Datos del cliente a actualizar.
 * @param {number} params.id - ID del cliente (requerido).
 * @param {string} [params.name] - Nuevo nombre del cliente.
 * @param {string} [params.lastName] - Nuevo apellido del cliente.
 * @param {string} [params.documentType] - Nuevo tipo de documento.
 * @param {string} [params.documentNumber] - Nuevo número de documento.
 * @param {string} [params.email] - Nuevo correo electrónico.
 * @param {string} [params.gender] - Nuevo género.
 * @param {string} [params.phoneNumber] - Nuevo número de teléfono.
 * @param {string} [params.address] - Nueva dirección.
 * @param {boolean} [params.isFrequentGuest] - Indica si es huésped frecuente.
 * @param {string} [params.notes] - Nuevas notas adicionales.
 * @param {boolean} [params.isActive] - Nuevo estado activo/inactivo.
 * @returns {Promise<Object>} Los datos del cliente actualizados en formato JSON.
 */
export async function updateCustomer({ id = null, name = null, lastName = null, documentType = null, documentNumber = null, email = null, gender = null, phoneNumber = null, address = null, isFrequentGuest = null, notes = null, isActive = null } = {}) {
    validateParamIsNotNull('id', id);

    const body = {};
    if (name !== null) body.name = name;
    if (lastName !== null) body.lastName = lastName;
    if (documentType !== null) body.documentType = documentType;
    if (documentNumber !== null) body.documentNumber = documentNumber;
    if (email !== null) body.email = email;
    if (gender !== null) body.gender = gender;
    if (phoneNumber !== null) body.phoneNumber = phoneNumber;
    if (address !== null) body.address = address;
    if (isFrequentGuest !== null) body.isFrequentGuest = isFrequentGuest;
    if (notes !== null) body.notes = notes;
    if (isActive !== null) body.isActive = isActive;

    try {
        const response = await fetch(BACKEND_ROUTES.customers.update(id), {
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
 * Elimina un cliente por su ID.
 * @async
 * @function deleteCustomer
 * @param {number} id - El ID del cliente.
 * @returns {Promise<Object>} Los datos de la operación de eliminación en formato JSON.
 */
export async function deleteCustomer(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.customers.delete(id), {
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

/* PRUEBAS DE LOS METODOS PARA LA CRUD DE LOS CLIENTES (CUSTOMERS) */
const customerDataRequired = {
    name: 'John',
    lastName: 'Doe',
    documentType: 'DNI',
    documentNumber: '123456',
    email: 'john.doe@example.com'
};
const customerDataAll = {
    name: 'Jane',
    lastName: 'Smith',
    documentType: 'PASAPORTE',
    documentNumber: '654321',
    email: 'jane.smith@example.com',
    gender: 'Female',
    phoneNumber: '9876543210',
    address: '456 Elm St',
    isFrequentGuest: false,
    notes: 'VIP customer',
    isActive: true
};
const updatedCustomerData = {
    id: 20, // Se debe utilizar un id válido
    name: 'Johnathan',
    lastName: 'Doe',
    email: 'johnathan.doe@example.com',
};

// console.log(await getAllCustomers());
// console.log(await getCustomerById(2)); // Se debe utilizar un id válido
// console.log(await getCustomerByDocumentNumber('4105648')); // Se debe utilizar un numero de documento válido
// console.log(await createCustomer(customerDataRequired));
// console.log(await createCustomer(customerDataAll));
// console.log(await updateCustomer(updatedCustomerData));
// console.log(await deleteCustomer(24)); // Se debe utilizar un id válido 
