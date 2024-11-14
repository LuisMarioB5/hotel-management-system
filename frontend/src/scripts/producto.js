import { getAllProducts, createProduct, updateProduct, deleteProduct, getProductById } from '../integrations/product.integration.js';

let allProducts = [];
let currentPage = 1;
let recordsPerPage = 10; // Cambiado a 10 como valor por defecto

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

async function loadProducts() {
    try {
        allProducts = await getAllProducts();
        filterAndRenderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function filterAndRenderProducts() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    let filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.details.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        (product.isActive ? 'activo' : 'inactivo').includes(searchTerm)
    );

    const totalFilteredRecords = filteredProducts.length;
    const totalPages = Math.ceil(totalFilteredRecords / recordsPerPage);

    // Asegurar que la página actual esté dentro del rango
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }

    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

    renderProducts(productsToDisplay);
    updatePaginationInfo(totalFilteredRecords, totalPages);
}

function renderProducts(products) {
    const tableBody = document.querySelector('#productTable tbody');
    tableBody.innerHTML = '';

    products.forEach(product => {
        const row = `
            <tr>
                <td>${product.name}</td>
                <td>${product.details || 'N/A'}</td>
                <td>${product.category}</td>
                <td>${product.unitPrice}</td>
                <td>${product.quantity}</td>
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

function updatePaginationInfo(totalFilteredRecords, totalPages) {
    const paginationInfo = document.querySelector('.pagination-info label');
    const paginationButtons = document.querySelector('.pagination-buttons');

    paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    paginationButtons.style.display = totalPages > 1 ? 'flex' : 'none';
}

function setupEventListeners() {
    const createButton = document.querySelector('.create-button');
    createButton.addEventListener('click', () => openModal());

    const saveButton = document.querySelector('.btn_saveusu');
    saveButton.addEventListener('click', handleSaveProduct);

    document.querySelector('#productTable').addEventListener('click', handleTableActions);

    const searchInput = document.getElementById('searchUser');
    searchInput.addEventListener('input', filterAndRenderProducts);

    const recordsPerPageSelect = document.getElementById('recordsPerPage');
    recordsPerPageSelect.addEventListener('change', handleRecordsPerPageChange);

    const paginationButtons = document.querySelector('.pagination-buttons');
    paginationButtons.addEventListener('click', handlePaginationClick);
}

function handleRecordsPerPageChange(event) {
    recordsPerPage = parseInt(event.target.value);
    currentPage = 1;
    filterAndRenderProducts();
}

function handlePaginationClick(event) {
    if (event.target.classList.contains('pagination-btn')) {
        const action = event.target.getAttribute('data-action');
        const totalPages = Math.ceil(allProducts.length / recordsPerPage);

        if (action === 'prev' && currentPage > 1) {
            currentPage--;
        } else if (action === 'next' && currentPage < totalPages) {
            currentPage++;
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
        document.getElementById('categoria').value = 'Producto';
        document.getElementById('precio').value = '';
        document.getElementById('cantidad').value = '';
        document.getElementById('estado').value = 'Activo';
        saveButton.removeAttribute('data-id');
    }

    modal.style.display = 'flex';
}

function fillModalWithProductData(productData) {
    document.getElementById('nombre').value = productData.name;
    document.getElementById('detalle').value = productData.details || '';
    document.getElementById('categoria').value = productData.category;
    document.getElementById('precio').value = productData.unitPrice;
    document.getElementById('cantidad').value = productData.quantity;
    document.getElementById('estado').value = productData.isActive ? 'Activo' : 'Inactivo';
}

async function handleSaveProduct() {
    if (!confirm('¿Está seguro de que desea guardar los cambios?')) {
        return;
    }

    const name = document.getElementById('nombre').value;
    const details = document.getElementById('detalle').value;
    const category = document.getElementById('categoria').value;
    const unitPrice = parseFloat(document.getElementById('precio').value);
    const quantity = parseInt(document.getElementById('cantidad').value);
    const isActive = document.getElementById('estado').value === 'Activo';

    const productData = { name, details, category, unitPrice, quantity, isActive };
    const productId = this.getAttribute('data-id');

    try {
        if (productId) {
            await updateProduct({ id: productId, ...productData });
        } else {
            await createProduct(productData);
        }
        closeModal();
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Error al guardar el producto');
    }
}

function handleTableActions(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const productId = target.getAttribute('data-id');
    if (target.classList.contains('edit-btn')) {
        handleEdit(productId);
    } else if (target.classList.contains('delete-btn')) {
        handleDelete(productId);
    }
}

async function handleEdit(productId) {
    try {
        const product = await getProductById(parseInt(productId));
        if (product) {
            openModal(product);
        } else {
            throw new Error('Product not found');
        }
    } catch (error) {
        console.error('Error fetching product data:', error);
        alert('Error al obtener los datos del producto');
    }
}

async function handleDelete(productId) {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
        try {
            await deleteProduct(parseInt(productId));
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error al eliminar el producto');
        }
    }
}

function closeModal() {
    document.getElementById('createUserModal').style.display = 'none';
}

// Expose necessary functions to window object for inline event handlers
window.closeModal = closeModal;
window.guardarProducto = handleSaveProduct;
