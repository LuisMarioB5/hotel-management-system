import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { validateParamIsNotNull } from '../scripts/utils.js';

/**
 * Obtiene todos los productos.
 * @async
 * @function getAllProducts
 * @returns {Promise<Object[]>} Una lista con los productos en formato JSON.
 */
export async function getAllProducts() {
    try {
        const response = await fetch(BACKEND_ROUTES.products.getAll, {
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
 * Obtiene un producto por su ID.
 * @async
 * @function getProductById
 * @param {number} id - El ID del producto.
 * @returns {Promise<Object>} Los datos del producto en formato JSON.
 */
export async function getProductById(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.products.getById(id), {
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
 * Obtiene un producto por su nombre.
 * @async
 * @function getProductByName
 * @param {string} name - El nombre del producto.
 * @returns {Promise<Object>} Los datos del producto en formato JSON.
 */
export async function getProductByName(name) {
    validateParamIsNotNull('name', name);

    try {
        const response = await fetch(BACKEND_ROUTES.products.getByName(name), {
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
 * Crea un nuevo producto.
 * @async
 * @function createProduct
 * @param {Object} params - Datos del producto.
 * @param {string} params.name - Nombre del producto (requerido).
 * @param {number} params.unitPrice - Precio del producto (requerido).
 * @param {number} params.quantity - Cantidad del producto (requerido).
 * @param {string} [params.details] - Detalles relacionados a la producto.
 * @param {boolean} [params.isActive] - Estado del producto.
 * @returns {Promise<Object>} Los datos del producto recién creado en formato JSON.
 */
export async function createProduct({ name = null, unitPrice = null, quantity = null, details = null, isActive = null} = {}) {
    validateParamIsNotNull('name', name);
    validateParamIsNotNull('unitPrice', unitPrice);
    validateParamIsNotNull('quantity', quantity);

    const body = { 
        name,
        unitPrice,
        quantity
     };
    
     if(details !== null) body.details = details;
     if(isActive !== null) body.isActive = isActive;

    try {
        const response = await fetch(BACKEND_ROUTES.products.create, {
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
 * Actualiza los datos de un producto.
 * @async
 * @function updateProduct
 * @param {Object} params - Datos del producto.
 * @param {number} params.id -ID del producto (requerido).
 * @param {string} [params.name] - Nombre del producto.
 * @param {number} [params.unitPrice] - Precio del producto.
 * @param {number} [params.quantity] - Cantidad del producto.
 * @param {string} [params.details] - Detalles relacionados a la producto.
 * @param {boolean} [params.isActive] - Estado del producto.
 * @returns {Promise<Object>} Los datos del producto actualizados en formato JSON.
 */
export async function updateProduct({ id = null, name = null, unitPrice = null, quantity = null, details = null, isActive = null} = {}) {
    validateParamIsNotNull('id', id);

    const body = {};
    if(name !== null) body.name = name;
    if(unitPrice !== null) body.unitPrice = unitPrice;
    if(quantity !== null) body.quantity = quantity;
    if(details !== null) body.details = details;
    if(isActive !== null) body.isActive = isActive;

    try {
        const response = await fetch(BACKEND_ROUTES.products.update(id), {
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
 * Desactiva un producto por su ID.
 * @async
 * @function desactiveProduct
 * @param {number} id - El ID del producto.
 */
export async function desactiveProduct(id) {
    validateParamIsNotNull('id', id);
    const body = {
        isActive: false,
    };

    try {
        const response = await fetch(BACKEND_ROUTES.products.update(id), {
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
 * Elimina un producto por su ID.
 * @async
 * @function deleteProduct
 * @param {number} id - El ID del producto.
 */
export async function deleteProduct(id) {
    validateParamIsNotNull('id', id);

    try {
        const response = await fetch(BACKEND_ROUTES.products.delete(id), {
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


/* PRUEBAS DE LOS METODOS PARA LA CRUD DE LOS PRODUCTOS (Products) */
const productDataRequired = {
    name: 'Cerveza M0delo',
    unitPrice: 110,
    quantity: 10,
};
const productDataAll = {
    name: 'Cerveza Presidente',
    unitPrice: 150,
    quantity: 5,
    details: 'Cerveza Presidente Jumbo',
    isActive: true,
};
const updatedProductData = {
    id: 7, // Se debe utilizar un id válido
    name: 'Cerveza Módelo2',
    unitPrice: 120,
    quantity: 15,
    details: 'Cerveza Módelo Grande',
    isActive: true,
};

// console.log(await createProduct(productDataRequired));
// console.log(await createProduct(productDataAll));
// console.log(await getAllProducts());
// console.log(await getProductById(3)); // Se debe utilizar un id válido
// console.log(await getProductByName("Cerveza Presidente")); // Se debe utilizar un nombre válido
// console.log(await updateProduct(updatedProductData)); // ME FALTA DE AQUI PARA ABAJO Y ADEMAS TAMBIEN DEBO PROBAR EN POSTMAN
// console.log(await desactiveProduct(7)); // Se debe utilizar un id válido
// console.log(await deleteProduct(7));
