import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../integrations/product.integration.js';

let allProducts = [];
let currentPage = 1;
let recordsPerPage = 'All';

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

async function loadProducts() {
    try {
        allProducts = await getAllProducts();
        filterAndRenderProducts();
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

function filterAndRenderProducts() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    let filteredProducts = allProducts.filter(product => 
        Object.values(product).some(value => 
            value && value.toString().toLowerCase().includes(searchTerm)
        )
    );

    const totalFilteredRecords = filteredProducts.length;

    if (recordsPerPage !== 'All') {
        const startIndex = (currentPage - 1) * parseInt(recordsPerPage);
        const endIndex = startIndex + parseInt(recordsPerPage);
        filteredProducts = filteredProducts.slice(startIndex, endIndex);
    }

    renderProducts(filteredProducts);
    updatePaginationInfo(totalFilteredRecords);
}

function renderProducts(products) {
    const tableBody = document.querySelector('table tbody');
    tableBody.innerHTML = '';

    products.forEach(product => {
        // Condición para cantidad baja (negrita y rojo) solo en productos
        const quantityStyle = 
            product.category !== 'SERVICIO' && product.quantity > 0 && product.quantity <= 5
            ? 'style="color: red; font-weight: bold;", '
            : '';

        const row = `
            <tr>
                <td>${product.name || 'N/A'}</td>
                <td>${product.details || 'N/A'}</td>
                <td>${product.category || 'N/A'}</td>
                <td>RD$${product.unitPrice || 'N/A'}</td>
                <td ${quantityStyle}>${product.quantity || 'N/A'}</td>
                <td><span class="status ${product.isActive ? 'active' : 'inactive'}">${product.isActive ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button class="edit-btn" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${product.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}


function updatePaginationInfo(totalFilteredRecords) {
    const paginationInfo = document.querySelector('.pagination-info label');
    const paginationButtons = document.querySelector('.pagination-buttons');

    if (recordsPerPage === 'All') {
        paginationInfo.textContent = `Mostrando todos los registros (${totalFilteredRecords})`;
        paginationButtons.style.display = 'none';
    } else {
        const totalPages = Math.ceil(totalFilteredRecords / parseInt(recordsPerPage));
        paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        paginationButtons.style.display = 'flex';
    }
}

function setupEventListeners() {
    const createButton = document.querySelector('.create-button');
    createButton.addEventListener('click', () => openModal());

    const saveButton = document.querySelector('.btn_saveusu');
    saveButton.addEventListener('click', handleSaveProduct);

    document.querySelector('table').addEventListener('click', handleTableActions);

    const searchInput = document.getElementById('searchUser');
    searchInput.addEventListener('input', filterAndRenderProducts);

    const recordsPerPageSelect = document.getElementById('recordsPerPage');
    recordsPerPageSelect.addEventListener('change', handleRecordsPerPageChange);

    const paginationButtons = document.querySelector('.pagination-buttons');
    paginationButtons.addEventListener('click', handlePaginationClick);
}

function handleRecordsPerPageChange(event) {
    recordsPerPage = event.target.value;
    currentPage = 1;
    filterAndRenderProducts();
}

function handlePaginationClick(event) {
    if (event.target.classList.contains('pagination-btn')) {
        if (event.target.textContent === '<') {
            currentPage = Math.max(1, currentPage - 1);
        } else if (event.target.textContent === '>') {
            const totalFilteredRecords = allProducts.filter(product => 
                Object.values(product).some(value => 
                    value && value.toString().toLowerCase().includes(document.getElementById('searchUser').value.toLowerCase())
                )
            ).length;
            const totalPages = Math.ceil(totalFilteredRecords / parseInt(recordsPerPage));
            currentPage = Math.min(totalPages, currentPage + 1);
        }
        filterAndRenderProducts();
    }
}

function openModal(productData = null) {
    const modal = document.getElementById('createUserModal');
    const modalTitle = modal.querySelector('.modalusu-header h2');
    const saveButton = modal.querySelector('.btn_saveusu');

    if (productData) {
        modalTitle.textContent = 'Editar Producto';
        fillModalWithProductData(productData);
        saveButton.setAttribute('data-id', productData.id);
    } else {
        modalTitle.textContent = 'Crear Producto';
        document.getElementById('nombre').value = '';
        document.getElementById('detalle').value = '';
        document.getElementById('categoria').value = 'PRODUCTO';
        document.getElementById('precio').value = '';
        document.getElementById('cantidad').value = '';
        document.getElementById('estado').value = 'Activo';
        saveButton.removeAttribute('data-id');
    }

    modal.style.display = 'flex';
}

function fillModalWithProductData(productData) {
    document.getElementById('nombre').value = productData.name;
    document.getElementById('detalle').value = productData.details;
    document.getElementById('categoria').value = productData.category;
    document.getElementById('precio').value = productData.unitPrice;
    document.getElementById('cantidad').value = productData.quantity;
    document.getElementById('estado').value = productData.isActive ? 'Activo' : 'Inactivo';
}

async function handleSaveProduct() {
    const nombre = document.getElementById('nombre').value.trim();
    const detalle = document.getElementById('detalle').value.trim();
    const categoria = document.getElementById('categoria').value;
    const precio = document.getElementById('precio').value.trim();
    const cantidad = document.getElementById('cantidad').value.trim();
    const estado = document.getElementById('estado').value;

    // Validación de campos vacíos
    if (!nombre || !detalle || !precio || !cantidad) {
        Swal.fire({
            icon: 'error',
            title: 'Campos vacíos',
            text: 'Por favor, complete todos los campos obligatorios.',
        });
        return;
    }
        // Validación del tipo de datos para precio (decimal o float)
    if (!/^\d+(\.\d{1,2})?$/.test(precio)) {
        Swal.fire({
            icon: 'error',
            title: 'Precio inválido',
            text: 'Por favor, ingrese un precio válido (ejemplo: 10.99).',
        });
        return;
    }

    // Validación del tipo de datos para cantidad (int)
    if (!/^\d+$/.test(cantidad)) {
        Swal.fire({
            icon: 'error',
            title: 'Cantidad inválida',
            text: 'Por favor, ingrese un número entero para la cantidad.',
        });
        return;
    }

    // Validación para servicios
    if (categoria === 'SERVICIO' && parseInt(cantidad) > 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Cantidad inválida para servicio',
            text: 'La cantidad para un servicio debe ser 0.',
        });
        return;
    }

    const productData = {
        name: nombre,
        details: detalle,
        category: categoria,
        unitPrice: parseFloat(precio),
        quantity: parseInt(cantidad),
        isActive: estado === 'Activo'
    };

    const productId = this.getAttribute('data-id');

    try {
        if (productId) {
            await updateProduct({ id: productId, ...productData });
        } else {
            await createProduct(productData);
        }
        closeModal();
        loadProducts();
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'El producto se ha guardado correctamente.',
        });
    } catch (error) {
        console.error('Error al guardar producto:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al guardar el producto.',
        });
    }
}

async function handleDeleteProduct(productId) {
    const result = await Swal.fire({
        title: '¿Está seguro?',
        text: "¿Desea eliminar este producto? Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await deleteProduct(productId);
            loadProducts(); // Recargar la lista de productos después de la eliminación
            Swal.fire(
                'Eliminado',
                'El producto ha sido eliminado correctamente.',
                'success'
            );
        } catch (error) {
            console.error('Error al eliminar el producto:', error);
            Swal.fire(
                'Error',
                'Hubo un problema al eliminar el producto.',
                'error'
            );
        }
    }
}

function handleTableActions(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const productId = target.getAttribute('data-id');
    if (target.classList.contains('edit-btn')) {
        handleEdit(productId);
    } else if (target.classList.contains('delete-btn')) {
        handleDeleteProduct(productId);
    }
}


async function handleEdit(productId) {
    try {
        const product = allProducts.find(p => p.id === parseInt(productId));
        if (product) {
            openModal(product);
        } else {
            throw new Error('Producto no encontrado');
        }
    } catch (error) {
        console.error('Error al obtener datos del producto:', error);
        alert('Error al obtener los datos del producto');
    }
}

function closeModal() {
    document.getElementById('createUserModal').style.display = 'none';
}

// Exponer funciones necesarias al objeto window para los manejadores de eventos en línea
window.closeModal = closeModal;
window.guardarProducto = handleSaveProduct;

//
// ESTA PARTE PARA LOS REPORTES
//
