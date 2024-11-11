document.addEventListener('DOMContentLoaded', function() {
    let clientes = [
        { id: 1, tipoDocumento: "DNI", numeroDocumento: "4105648", nombre: "Mizuki", apellido: "Hayashi", correo: "mizuki@example.com", estado: "Activo" },
        { id: 2, tipoDocumento: "Pasaporte", numeroDocumento: "4545453", nombre: "Naomi", apellido: "Konoe", correo: "naomi@example.com", estado: "Activo" },
        { id: 3, tipoDocumento: "DNI", numeroDocumento: "3201456", nombre: "Carlos", apellido: "Rodríguez", correo: "carlos@example.com", estado: "Inactivo" },
        // Añade más clientes aquí para simular una base de datos más grande
    ];

    const clientesTable = document.getElementById('clientesTable');
    const clienteModal = document.getElementById('clienteModal');
    const closeButton = clienteModal.querySelector('.close-buttonusu');
    const saveButton = document.getElementById('saveCliente');
    const createButton = document.getElementById('createClienteBtn');
    const modalTitle = document.getElementById('modalTitle');
    const clienteForm = document.getElementById('clienteForm');

    let currentPage = 1;
    const recordsPerPage = 10;

    function renderTable() {
        const tbody = clientesTable.querySelector('tbody');
        tbody.innerHTML = '';

        const start = (currentPage - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const paginatedClientes = clientes.slice(start, end);

        paginatedClientes.forEach(cliente => {
            const row = tbody.insertRow();
            Object.values(cliente).forEach((value, index) => {
                if (index === 0) return; // Skip ID
                const cell = row.insertCell();
                const input = document.createElement('input');
                input.type = index === 4 ? 'email' : 'text';
                input.value = value;
                input.readOnly = true;
                cell.appendChild(input);
            });

            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.className = 'edit-btn';
            editBtn.title = 'Editar cliente';
            editBtn.onclick = () => openModal(cliente);

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.className = 'delete-btn';
            deleteBtn.title = 'Eliminar cliente';
            deleteBtn.onclick = () => deleteCliente(cliente.id);

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });

        updatePagination();
    }

    function updatePagination() {
        const totalPages = Math.ceil(clientes.length / recordsPerPage);
        document.getElementById('paginationLabel').textContent = `Página ${currentPage} de ${totalPages}`;
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
    }

    function openModal(cliente = null) {
        if (cliente) {
            modalTitle.textContent = 'Editar Cliente';
            document.getElementById('clienteId').value = cliente.id;
            document.getElementById('tipo').value = cliente.tipoDocumento;
            document.getElementById('documento').value = cliente.numeroDocumento;
            document.getElementById('nombre').value = cliente.nombre;
            document.getElementById('apellido').value = cliente.apellido;
            document.getElementById('correo').value = cliente.correo;
            document.getElementById('estado').value = cliente.estado;
        } else {
            modalTitle.textContent = 'Añadir Cliente';
            clienteForm.reset();
            document.getElementById('clienteId').value = '';
        }
        clienteModal.style.display = 'block';
    }

    function closeModal() {
        clienteModal.style.display = 'none';
    }

    function saveCliente() {
        const clienteId = document.getElementById('clienteId').value;
        const cliente = {
            id: clienteId ? parseInt(clienteId) : Date.now(),
            tipoDocumento: document.getElementById('tipo').value,
            numeroDocumento: document.getElementById('documento').value,
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            correo: document.getElementById('correo').value,
            estado: document.getElementById('estado').value
        };

        if (clienteId) {
            const index = clientes.findIndex(c => c.id === parseInt(clienteId));
            clientes[index] = cliente;
        } else {
            clientes.push(cliente);
        }

        closeModal();
        renderTable();
    }

    function deleteCliente(id) {
        if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
            clientes = clientes.filter(cliente => cliente.id !== id);
            renderTable();
        }
    }

    // Event Listeners
    createButton.addEventListener('click', () => openModal());
    closeButton.addEventListener('click', closeModal);
    saveButton.addEventListener('click', saveCliente);
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < Math.ceil(clientes.length / recordsPerPage)) {
            currentPage++;
            renderTable();
        }
    });

    // Inicializar la tabla
    renderTable();
});