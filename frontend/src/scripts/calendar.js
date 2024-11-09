document.addEventListener('DOMContentLoaded', function() {
    const calendarModal = document.getElementById('calendarModal');
    const showCalendarBtn = document.getElementById('showCalendarBtn');
    const closeCalendarBtn = document.getElementById('closeCalendarBtn');
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    let currentDate = new Date();
    let reservedDates = [
        { start: '2023-11-01', end: '2023-11-04' },
        { start: '2023-11-15', end: '2023-11-18' }
    ];

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

            // Verificar si el día está reservado
            const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isReserved = reservedDates.some(reservation => {
                const start = new Date(reservation.start);
                const end = new Date(reservation.end);
                const current = new Date(currentDateStr);
                return current >= start && current <= end;
            });

            if (isReserved) {
                dayElement.classList.add('reserved');
            }

            // Marcar el día actual
            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('today');
            }

            calendarDays.appendChild(dayElement);
        }
    }

    // Event Listeners
    showCalendarBtn.addEventListener('click', () => {
        currentDate = new Date(); // Resetear a la fecha actual
        calendarModal.style.display = 'flex';
        generateCalendar(currentDate);
    });

    closeCalendarBtn.addEventListener('click', () => {
        calendarModal.style.display = 'none';
    });

    prevMonthBtn.addEventListener('click', () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        if (newDate >= new Date()) {
            currentDate = newDate;
            generateCalendar(currentDate);
        }
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        generateCalendar(currentDate);
    });

    // Cerrar el modal al hacer clic fuera de él
    calendarModal.addEventListener('click', (e) => {
        if (e.target === calendarModal) {
            calendarModal.style.display = 'none';
        }
    });
});