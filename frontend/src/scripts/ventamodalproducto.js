import { getAllProducts, createProduct, updateProduct } from '../integrations/product.integration.js';

let allProducts = [];
let currentPage = 1;
let recordsPerPage = 10;

document.addEventListener('DOMContentLoaded', async () => {
    allProducts = (await getAllProducts()).filter(product => product.isActive); // Filter only active products
    loadProducts();
    setupEventListeners();
});

function loadProducts() {
    filterAndRenderProducts();
}

function filterAndRenderProducts() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    let filteredProducts = allProducts.filter(product =>
        Object.values(product).some(value =>
            value && value.toString().toLowerCase().includes(searchTerm)
        )
    );

    const totalFilteredRecords = filteredProducts.length;

    // Calculate products to show based on current page
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    filteredProducts = filteredProducts.slice(startIndex, endIndex);

    renderProducts(filteredProducts);
    updatePaginationInfo(totalFilteredRecords);
}

function renderProducts(products) {
    const tableBody = document.querySelector('#modalProductTable tbody');
    tableBody.innerHTML = '';

    products.forEach(product => {
        const row = `
            <tr data-id="${product.id}" data-quantity="${product.quantity}">
                <td>${product.name || 'N/A'}</td>
                <td>RD$${product.unitPrice || 'N/A'}</td>
                <td>${product.category || 'N/A'}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

function updatePaginationInfo(totalFilteredRecords) {
    const paginationInfo = document.querySelector('.pagination-info label');
    const paginationButtons = document.querySelector('.pagination-buttons');

    const totalPages = Math.ceil(totalFilteredRecords / recordsPerPage);
    paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;

    renderPaginationButtons(totalPages);
}

function renderPaginationButtons(totalPages) {
    const paginationButtons = document.querySelector('.pagination-buttons');
    paginationButtons.innerHTML = '';

    if (totalPages > 1) {
        if (currentPage > 1) {
            paginationButtons.insertAdjacentHTML('beforeend', `<button class="pagination-btn" data-action="prev"><</button>`);
        }
        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === currentPage ? 'active' : '';
            paginationButtons.insertAdjacentHTML('beforeend', `<button class="pagination-btn ${isActive}" data-page="${i}">${i}</button>`);
        }
        if (currentPage < totalPages) {
            paginationButtons.insertAdjacentHTML('beforeend', `<button class="pagination-btn" data-action="next">></button>`);
        }
    }
}

function handlePaginationClick(event) {
    const action = event.target.getAttribute('data-action');
    const totalFilteredRecords = allProducts.filter(product =>
        Object.values(product).some(value =>
            value && value.toString().toLowerCase().includes(document.getElementById('searchUser').value.toLowerCase())
        )
    ).length;
    const totalPages = Math.ceil(totalFilteredRecords / recordsPerPage);

    if (action === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (action === 'next' && currentPage < totalPages) {
        currentPage++;
    } else if (event.target.hasAttribute('data-page')) {
        const targetPage = parseInt(event.target.getAttribute('data-page'));
        if (targetPage >= 1 && targetPage <= totalPages) {
            currentPage = targetPage;
        }
    }

    filterAndRenderProducts();
}

function setupEventListeners() {
    document.getElementById('searchUser').addEventListener('input', () => {
        currentPage = 1; // Reset to first page when searching
        filterAndRenderProducts();
    });

    document.getElementById('recordsPerPage').addEventListener('change', event => {
        recordsPerPage = parseInt(event.target.value);
        currentPage = 1; // Reset to first page when changing number of records
        filterAndRenderProducts();
    });

    document.querySelector('.pagination-buttons').addEventListener('click', handlePaginationClick);
}

// Add event listener for double click on table rows in the modal
document.querySelector('#modalProductTable tbody').addEventListener('dblclick', event => {
    const targetRow = event.target.closest('tr');

    if (targetRow) {
        const cells = targetRow.getElementsByTagName('td');
        const id = targetRow.getAttribute('data-id');

        const stock = targetRow.getAttribute('data-quantity');
        const productName = cells[0].innerText || 'N/A';
        const productPrice = cells[1].innerText.replace('RD$', '') || '0';
        const category = cells[2].innerText || 'N/A';

        // Assign values to form fields
        document.getElementById('productSearch').value = productName;
        document.getElementById('UnitPrice').value = productPrice;

        
        // Set hidden input values
        document.getElementById('idproduct').value = id;
        document.getElementById('category').value = category;
        document.getElementById('stock').value = stock;
        
        // Show alert with product name
        Swal.fire({
            icon: 'success',
            title: `Producto ${productName} seleccionado`,
            showConfirmButton: false,
            timer: 750,
            timerProgressBar: true,
            heightAuto: false,
            customClass: {
                container: 'swal-container',
            },
        });

        // Close modal after selecting a product
        closeModal();
    }
});

function closeModal() {
    document.getElementById('createUserModal').style.display = 'none';
}

// Additional event listeners
document.addEventListener('DOMContentLoaded', async () => {
    allProducts = (await getAllProducts()).filter(product => product.isActive); // Filter only active products
    loadProducts();
    setupEventListeners();
});
