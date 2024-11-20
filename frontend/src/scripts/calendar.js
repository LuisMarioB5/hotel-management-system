import { getCustomerById } from '../integrations/customer.integration.js';
import { getAllBookings } from '../integrations/booking.integration.js';

export async function calendarioReserva() {
    const calendarModalHTML = `
        <div class="calendar-modal" id="calendarModal">
            <div class="calendar-modal-content">
                <div class="calendar-modal-header">
                    <div class="calendar-nav">
                        <button class="nav-btn" id="prevMonth"><i class="fas fa-chevron-left"></i></button>
                        <h3 id="currentMonth">Noviembre de 2024</h3>
                        <button class="nav-btn" id="nextMonth"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    <div class="view-options">
                        <button class="view-btn active">Mes</button>
                        <button class="view-btn">Semana</button>
                        <button class="view-btn">Día</button>
                    </div>
                    <button class="close-calendar-btn" id="closeCalendarBtn">&times;</button>
                </div>
                <div class="calendar-body">
                    <div class="calendar-weekdays">
                        <div>lun</div>
                        <div>mar</div>
                        <div>mié</div>
                        <div>jue</div>
                        <div>vie</div>
                        <div>sáb</div>
                        <div>dom</div>
                    </div>
                    <div class="calendar-days" id="calendarDays">
                        <!-- Los días se generarán dinámicamente con JavaScript -->
                    </div>
                </div>
                <div class="calendar-footer">
                    <div class="legend">
                        <div class="legend-item">
                            <span class="legend-color reserved"></span>
                            <span>Reservado</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color pending"></span>
                            <span>Pendiente</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color available"></span>
                            <span>Disponible</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', calendarModalHTML);

    const calendarModal = document.getElementById('calendarModal');
    const showCalendarBtn = document.getElementById('showCalendarBtn');
    const closeCalendarBtn = document.getElementById('closeCalendarBtn');
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    let currentDate = new Date();

    showCalendarBtn.addEventListener('click', () => {
        calendarModal.style.display = 'flex';
        generateCalendar(currentDate);
    });

    closeCalendarBtn.addEventListener('click', () => {
        calendarModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === calendarModal) {
            calendarModal.style.display = 'none';
        }
    });

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        generateCalendar(currentDate);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        generateCalendar(currentDate);
    });

    function generateCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // Actualizar el título del mes
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        currentMonthElement.textContent = `${monthNames[month]} de ${year}`;

        // Limpiar el calendario
        calendarDays.innerHTML = '';

        // Obtener el primer día del mes
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Ajustar para que la semana empiece en lunes (0 = lunes, 6 = domingo)
        let startingDay = firstDay.getDay() - 1;
        if (startingDay === -1) startingDay = 6;

        // Añadir días vacíos al principio
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDay);
        }

        // Añadir los días del mes
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            // Marcar el día actual
            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('today');
            }

            calendarDays.appendChild(dayElement);
        }

        // Obtener las reservas y marcar los días reservados
        markReservedDays(year, month);
    }

    async function markReservedDays(year, month) {
        const roomId = parseInt(new URLSearchParams(window.location.search).get('roomId'), 10);
        const bookings = await getAllBookings();
        const roomBookings = bookings.filter(booking => booking.room.id === roomId);

        for (const booking of roomBookings) {
            const checkInDate = new Date(booking.checkInDate);
            const checkOutDate = new Date(booking.checkOutDate);
            const customer = await getCustomerById(booking.customer.id);

            const days = document.querySelectorAll('.calendar-day:not(.empty)');
            days.forEach(day => {
                const dayDate = new Date(year, month, parseInt(day.textContent, 10));
                if (dayDate >= checkInDate && dayDate <= checkOutDate) {
                    day.classList.add(booking.status === 'CONFIRMADA' ? 'reserved' : 'pending');
                    day.innerHTML += `<div class="booking-info">${booking.status}: ${customer.name} ${customer.lastName}</div>`;
                }
            });
        }
    }
}
// Agregar CSS al documento
const estilo = document.createElement('style');
estilo.textContent = `
    .calendar-modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
    }

    .calendar-modal-content {
        background-color: white;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: modalFadeIn 0.3s ease;
    }

    .calendar-modal-header {
        padding: 10px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .calendar-nav {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        justify-content: center;
    }

    .nav-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        color: #666;
        padding: 5px;
    }

    .nav-btn:hover {
        color: #4a7aff;
    }

    #currentMonth {
        margin: 0;
        font-size: 1rem;
        color: #333;
    }

    .view-options {
        display: flex;
        gap: 5px;
    }

    .view-btn {
        background: none;
        border: 1px solid #ddd;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        color: #666;
    }

    .view-btn.active {
        background-color: #4a7aff;
        color: white;
        border-color: #4a7aff;
    }

    .close-calendar-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0 5px;
    }

    .close-calendar-btn:hover {
        color: #ff4444;
    }

    .calendar-body {
        padding: 10px;
    }

    .calendar-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        color: #4a7aff;
        font-size: 0.8rem;
        margin-bottom: 5px;
    }

        .calendar-days {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
    }

    .calendar-day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        color: #666;
        border: 1px solid #eee;
        border-radius: 4px;
        cursor: pointer;
        position: relative;
    }

    .calendar-day.reserved {
        background-color: #ffd700;
        color: #333;
    }

    .calendar-day.pending {
        background-color: #800080;
        color: #fff;
    }

    .calendar-day.today {
        border-color: #4a7aff;
        color: #4a7aff;
        font-weight: bold;
    }

    .calendar-day:hover:not(.reserved):not(.pending) {
        background-color: #f8f9fa;
    }

    .calendar-footer {
        padding: 15px;
        border-top: 1px solid #eee;
    }

    .legend {
        display: flex;
        gap: 20px;
        justify-content: center;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.9rem;
        color: #666;
    }

    .legend-color {
        width: 15px;
        height: 15px;
        border-radius: 3px;
    }

    .legend-color.reserved {
        background-color: #ffd700;
    }

    .legend-color.pending {
        background-color: #800080;
    }

    .legend-color.available {
        background-color: white;
        border: 1px solid #eee;
    }

    @media (max-width: 768px) {
        .calendar-modal-content {
            width: 95%;
            margin: 10px;
            max-width: 350px;
        }

        .calendar-modal-header {
            flex-direction: column;
            gap: 10px;
        }

        .view-options {
            width: 100%;
            justify-content: center;
        }

        .calendar-day {
            font-size: 0.75rem;
        }
    }

    @media (max-width: 480px) {
        .date-container {
            flex-wrap: wrap;
        }

        .icon-date {
            width: calc(100% - 140px) !important;
        }

        .availability-btn {
            flex-shrink: 0;
        }

        .calendar-weekdays div,
        .calendar-day {
            font-size: 0.7rem;
        }
    }
`;
document.head.append(estilo);

// Inicializar el calendario al cargar la página
document.addEventListener('DOMContentLoaded', calendarioReserva);

