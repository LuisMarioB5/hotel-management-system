import { createCustomer, getCustomerByDocumentNumber, updateCustomer } from '../integrations/customer.integration.js';
import { createBooking, confirmBooking, cancelBooking, checkInBooking, getAllBookings, updateBooking, getBookingById,checkOutBooking, desactiveBooking } from '../integrations/booking.integration.js';
import { updateRoom,getAllRooms,getRoomById } from '../integrations/room.integration.js';
import { getConsumptionByBookingId,getConsumptionById, getAllConsumptions,createProduct,updateProduct,deleteProduct } from '../integrations/consumption.integration.js';


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
             ////ESTA PARTE ES PARA LA PAGINA DE G_SALIDAHABITACION///
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
        console.log('Reservation data:', reservation);
        if (!reservation) {
            console.error('Reservation not found');
            return;
        }

        // Helper function to safely set input values
        const setInputValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        };

        // Populate the form fields with reservation data
        setInputValue('roomNumber', reservation.room.number);
        setInputValue('roomDetails', reservation.room.details);
        setInputValue('roomCategory', reservation.room.type);
        setInputValue('roomFloor', reservation.room.floor);
        setInputValue('clientName', `${reservation.customer.name} ${reservation.customer.lastName}`);
        setInputValue('nroDocumento', reservation.customer.documentNumber);
        setInputValue('correo', reservation.customer.email);
        
        // Format the date to 'yyyy-MM-dd'
        const checkInDate = new Date(reservation.checkInDate);
        const formattedDate = checkInDate.toISOString().split('T')[0];
        setInputValue('fechaEntrada', formattedDate);

        setInputValue('bookingDetails', reservation.details);
        setInputValue('roomCost', 'RD$' + reservation.stayCost * reservation.totalStayDays);
        setInputValue('cashAdvance','RD$' + reservation.cashAdvance);
        setInputValue('remainingAmount','RD$' +  reservation.totalCost);

        // Add event listener for the finish check-out button
        const finishButton = document.querySelector('.finish-sale-btn');
        if (finishButton) {
           // finishButton.addEventListener('click', () => finishCheckOut(reservationId));
        } else {
            //console.warn('Finish check-out button not found');
        }
    } catch (error) {
        console.error('Error initializing room check-out page:', error);
    }
    
}