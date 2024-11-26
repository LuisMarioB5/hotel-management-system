import { getProductById,updateProduct, desactiveProduct } from '../integrations/product.integration.js';
import {  getAllBookings, getBookingById } from '../integrations/booking.integration.js';
import { createConsumption  } from '../integrations/consumption.integration.js';


//----------------------------------------------------------------------------//
             ////ESTA PARTE ES PARA LA PAGINA DE G_SALIDA///
//----------------------------------------------------------------------------//
// Funcion para obtener reservaciones activas
export async function getActiveReservations() {
    try {
        const allBookings = await getAllBookings();
        return allBookings.filter(booking => 
            booking.status === 'CHECKED_IN' && booking.isActive
        );
    } catch (error) {
        console.error('Error fetching active reservations:', error);
        throw error;
    }
}

export function initializeRoomSale() {
    const roomsGrid = document.querySelector('.rooms-grid');
    const floorSelector = document.querySelector('.floor-selector');

    async function loadActiveReservations(floor = 'Todos') {
        try {
            const activeReservations = await getActiveReservations();
            const reservationsToShow = activeReservations.filter(reservation =>
                floor === 'Todos' || reservation.room.floor.toUpperCase() === floor
            );
            renderActiveReservations(reservationsToShow);
        } catch (error) {
            console.error('Error loading active reservations:', error);
        }
    }

    function renderActiveReservations(reservations) {
        roomsGrid.innerHTML = '';
        reservations.forEach(reservation => {
            const roomCard = `
                <div class="room-card ocupado">
                    <div class="room-header">
                        <span class="room-number">NRO: ${reservation.room.number}</span>
                        <i class="fas fa-user-check room-icon"></i>
                    </div>
                    <div class="room-category">
                        CATEGORIA: ${reservation.room.type}
                    </div>
                    <div class="room-status ocupado" onclick="redirectToVentaHabitacion('${reservation.id}')">
                        Iniciar Venta
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
            roomsGrid.insertAdjacentHTML('beforeend', roomCard);
        });
    }

    floorSelector.addEventListener('change', () => loadActiveReservations(floorSelector.value));

    // Initial load
    loadActiveReservations();

    // Expose function to window object for the onclick event
    window.redirectToVentaHabitacion = function(reservationId) {
        window.location.href = `../pages/T_ventaHabitacion.html?reservationId=${reservationId}`;
    };
}

//----------------------------------------------------------------------------//
             ////ESTA PARTE ES PARA LA PAGINA DE T_ventaHabitacion///
//----------------------------------------------------------------------------//
export async function initializeRoomResume() {
    const urlParams = new URLSearchParams(window.location.search);
    const reservationId = urlParams.get('reservationId');

    if (!reservationId) {
        console.error('No reservation ID provided');
        return;
    }

    try {
        const reservation = await getBookingById(reservationId);
        if (!reservation) {
            console.error('Reservation not found');
            return;
        }
            // Helper para establecer valores en inputs
            const setInputValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        };

        // Poblamos los datos del formulario con información de la reserva
        setInputValue('roomNumber', reservation.room.number);
        setInputValue('roomDetails', reservation.room.details);
        setInputValue('roomCategory', reservation.room.type);
        setInputValue('roomFloor', reservation.room.floor);
        setInputValue('clientName', `${reservation.customer.name} ${reservation.customer.lastName}`);
        setInputValue('nroDocumento', reservation.customer.documentNumber);
        setInputValue('correo', reservation.customer.email);
        
        // Formatear la fecha a 'yyyy-MM-dd'
        const checkInDate = new Date(reservation.checkInDate);
        const formattedDate = checkInDate.toISOString().split('T')[0];
        setInputValue('fechaEntrada', formattedDate);

    } catch (error) {
        console.error('Error initializing room check-out page:', error);
    }
    
    setupProductManagement();

}

function setupProductManagement() {
    // Llamar a la función para inyectar los estilos al inicio del script
    injectToastStyles();
    injectButtonAnimationStyles();
    
    const cart = [];
    const tableBody = document.querySelector('#tablabody');
    const totalAmountInput = document.querySelector('.total-amount');
        const saleStatusSelect = document.querySelector('.sale-status select');
        const finalizeSaleBtn = document.getElementById('finalize-sale-btn');

    function showAlert(message) {
        Swal.fire({
            toast: true,
            position: 'bottom-left',
            icon: 'warning',
            title: message,
            showConfirmButton: false,
            timer: 1700,
            timerProgressBar: true,
            customClass: {
                popup: 'swal-toast',
            },
        });
    }
    
    // Validaciones dinámicas del input de cantidad
    const quantityInput = document.getElementById('cantidad');
    quantityInput.addEventListener('input', () => {
        const category = document.getElementById('category').value.trim().toUpperCase();
        const stock = parseInt(document.getElementById('stock').value) || 0;

        if (category === 'SERVICIO') {
            quantityInput.value = 1; // Forzar la cantidad a 1 para servicios
            showAlert('La cantidad de un SERVICIO solo debería ser 1.');
        } else if (category === 'PRODUCTO') {
            const quantity = parseInt(quantityInput.value) || 0;
            if (quantity > stock) {
                showAlert(`No hay suficiente inventario. Disponible: ${stock}`);
                quantityInput.value = Math.min(stock, 1); // Restablecer a 1 si excede el stock
            }
        }
    });

    function injectToastStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Personalización de las Toast Notifications */
            .swal-toast {
                font-size: 0.9rem;  /* Tamaño de fuente más pequeño */
                padding: 8px;       /* Ajustar el padding */
                width: auto;        /* Dejar que el ancho se ajuste al contenido */
                min-width: 200px;   /* Asegurar un mínimo de ancho */
            }
        `;
        document.head.appendChild(style);
    }
    
    function showButtonError(buttonId) {
        const button = document.getElementById(buttonId);
    
        // Agregar clase para el borde rojo y animación
        button.classList.add('is-invalid');
    
        // Aplicar estilos personalizados
        button.style.borderColor = '#dc3545';
        button.style.boxShadow = '0 0 0 0.25rem rgba(220, 53, 69, 0.25)';
    
        // Animación de "sacudida"
        button.style.animation = 'shake 0.3s';
    
        // Configurar temporizador para eliminar el estilo después de 3 segundos
        setTimeout(() => {
            clearButtonError(buttonId);
        }, 1700);
    }
    
    function clearButtonError(buttonId) {
        const button = document.getElementById(buttonId);
        if (!button) return;
    
        // Quitar estilos personalizados y clase de error
        button.classList.remove('is-invalid');
        button.style.borderColor = '';
        button.style.boxShadow = '';
        button.style.animation = '';
    }
        // Inyectar CSS de animación para el botón
    function injectButtonAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 100% {
                    transform: translateX(0);
                }
                25% {
                    transform: translateX(-4px);
                }
                50% {
                    transform: translateX(4px);
                }
                75% {
                    transform: translateX(-4px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Agregar producto/servicio al carrito
    document.getElementById('add-btn').addEventListener('click', () => {
        const productName = document.getElementById('productSearch').value.trim();
        const unitPrice = parseFloat(document.getElementById('UnitPrice').value) || 0;
        const quantity = parseInt(quantityInput.value) || 0;
        const category = document.getElementById('category').value.trim().toUpperCase();
        const stockInput = document.getElementById('stock');
        const stock = parseInt(stockInput.value) || 0; // Obtener stock actual
        const productId = parseInt(document.getElementById('idproduct').value);
    
        if (!productId) {
            showAlert('Error: No se ha seleccionado un producto válido.');
            return;
        }
       
        if (!productName) {
            showAlert('Seleccione un producto/servicio.');
            showButtonError('productSearch');
            return;
        }
    
        if (category === 'SERVICIO' && quantity !== 1) {
            showAlert('La cantidad de un SERVICIO solo debería ser 1.');
            quantityInput.value = 1;
            return;
        }
    
        if (category === 'PRODUCTO') {
            if (quantity > stock) {
                showAlert(`No hay suficiente inventario. Disponible: ${stock}`);
                return;
            }
    
            // Actualizamos el stock y verificamos si es bajo
            const updatedStock = stock - quantity;
            
            // Verificamos si el stock es bajo
            if (updatedStock < 6) {
                showAlert(`El stock del producto es bajo. Solo quedan ${updatedStock} unidades.`);
            }               
        }
    
        if (cart.some(item => item.name === productName)) {
            showAlert('El producto ya está en la tabla. Elimínelo primero si desea modificarlo.');
            return;
        }
    
        const subtotal = unitPrice * quantity;
        cart.push({ id: productId, name: productName, price: unitPrice, quantity, subtotal, category });

        renderCart();
        updateTotal();
    
        // Reinicializar los campos después de agregar
        document.getElementById('productSearch').value = '';
        document.getElementById('UnitPrice').value = '0.00';
        quantityInput.value = 1;
    });

   

    function renderCart() {
        tableBody.innerHTML = '';
        cart.forEach((item, index) => {
            const row = `
                <tr data-product-id="${item.id}" data-category="${item.category}">
                    <td>
                        <button class="del-btn" onclick="removeFromCart(${index})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>RD$${item.price.toFixed(2)}</td>
                    <td>RD$${item.subtotal.toFixed(2)}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    }

    function updateTotal() {
        const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
        totalAmountInput.value = `RD$${total.toFixed(2)}`;
    }

    window.removeFromCart = (index) => {
        const removedItem = cart.splice(index, 1)[0];
        if (removedItem.category === 'PRODUCTO') {
            const stockInput = document.getElementById('stock');
            stockInput.value = parseInt(stockInput.value) + removedItem.quantity;
        }
    
        renderCart();
        updateTotal();
    };
    
    async function finalizarVenta() {
        const tableRows = tableBody.querySelectorAll('tr');
        const reservationId = new URLSearchParams(window.location.search).get('reservationId');
    
        if (tableRows.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Tabla vacía',
                text: 'No hay productos o servicios para guardar.',
                toast: true,
                position: 'bottom-left',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            return;
        }
    
        const saleStatus = saleStatusSelect.value;
        let successCount = 0;
        let errorCount = 0;
    
        for (const row of tableRows) {
            const productId = parseInt(row.getAttribute('data-product-id'));
            const category = row.getAttribute('data-category');
            const productName = row.cells[1].textContent.trim();
            const quantity = parseInt(row.cells[2].textContent.trim());
            const unitPrice = parseFloat(row.cells[3].textContent.replace('RD$', '').trim());
            const subtotal = parseFloat(row.cells[4].textContent.replace('RD$', '').trim());
    
            // Validar valores clave
            if (!productId || isNaN(productId)) {
                console.error(`ID de producto inválido o no encontrado para ${productName}`);
                errorCount++;
                continue;
            }
            if (isNaN(unitPrice)) {
                console.error(`Precio unitario inválido o no encontrado para ${productName}`);
                errorCount++;
                continue;
            }
    
            try {
                const consumptionData = {
                    bookingId: parseInt(reservationId),
                    productId: productId,
                    quantity: quantity,
                    availability: saleStatus,
                };
            
                // Crear registro de consumo
                await createConsumption(consumptionData);
                
                // Actualizar stock solo si es un producto, no un servicio
                if (category === 'PRODUCTO') {
                    const currentProduct = await getProductById(productId);
    
                    if (currentProduct) {
                        const updatedStock = currentProduct.quantity - quantity;
    
                        // Validar stock y actualizar
                        if (updatedStock < 0) {
                            console.error(`Stock insuficiente para el producto: ${productName}`);
                            errorCount++;
                        } else {
                            await updateProduct({
                                id: productId,
                                quantity: updatedStock
                            });
    
                            // Desactivar producto si el stock llega a 0
                            if (updatedStock === 0) {
                                await desactiveProduct(productId);
                            }
                        }
                    } else {
                        console.error(`Producto no encontrado: ${productName}`);
                        errorCount++;
                    }
                }
    
                successCount++;
            } catch (error) {
                console.error(`Error procesando ${productName}:`, error);
                errorCount++;
            }
        }
    
        // Mostrar mensaje de resultado
        if (errorCount === 0) {
            Swal.fire({
                icon: 'success',
                title: 'Guardado exitoso',
                text: `Se han guardado ${successCount} productos/servicios correctamente.`,
                showCancelButton: true,
                confirmButtonText: 'Imprimir factura',
                cancelButtonText: 'Cerrar',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                allowOutsideClick: false
            }).then((result) => {
                if (result.isConfirmed) {
                    // Implementar funcionalidad de impresión aquí
                   
                }
            });
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Guardado parcial',
                text: `Se guardaron ${successCount} productos/servicios. Hubo ${errorCount} errores.`,
                showConfirmButton: true
            });
        }
    
        // Limpiar la tabla y reiniciar total después de guardar exitosamente
        tableBody.innerHTML = '';
        totalAmountInput.value = 'RD$0.00';
        cart.length = 0; // Limpiar el carrito
    }  

    finalizeSaleBtn.addEventListener('click', finalizarVenta);
    
}
