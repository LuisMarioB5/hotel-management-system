import { getAllTasks, createTask, assignTask, startTask, completeTask, cancelTask } from '../integrations/housekeeping.integration.js';
import { getAllRooms } from '../integrations/room.integration.js';
import { getAllUsers } from '../integrations/user.integration.js';
import { validateJwt } from '../auth/utils.auth.js';

function showAlert(icon, title, text, timer = 1600) {
    return Swal.fire({
        icon,
        title,
        text,
        timer,
        showConfirmButton: false,
        heightAuto: false,
        customClass: {
            container: 'swal-container',
        },
    });
}

// Validación por campo (contorno rojo + mensaje debajo), en vez de un
// Swal.fire — dentro de un modal, Swal2 queda detrás (.modal tiene
// z-index:2000, más alto que el z-index por defecto de Swal2) y el aviso
// terminaba invisible "por debajo" del modal.
function showFieldError(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    clearFieldError(fieldId);

    field.style.borderColor = '#dc3545';
    field.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = errorMessage;
    errorDiv.style.cssText = 'color: #dc3545; font-size: 0.85em; margin-top: 4px;';

    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.style.borderColor = '';
    field.style.boxShadow = '';

    const errorDiv = field.parentNode.querySelector('.error-message');
    if (errorDiv) errorDiv.remove();
}

export function initializeHousekeepingBoard() {
    const floorFilter = document.getElementById('hkFloorFilter');
    const typeFilter = document.getElementById('hkTypeFilter');
    const priorityFilter = document.getElementById('hkPriorityFilter');

    const reportModal = document.getElementById('reportModal');
    const openReportModalBtn = document.getElementById('openReportModal');
    const closeReportModalBtn = document.getElementById('closeReportModal');
    const cancelReportBtn = document.getElementById('cancelReport');
    const confirmReportBtn = document.getElementById('confirmReport');
    const reportRoomSelect = document.getElementById('reportRoomSelect');
    const reportPrioritySelect = document.getElementById('reportPrioritySelect');
    const reportDescription = document.getElementById('reportDescription');

    const assignModal = document.getElementById('assignModal');
    const closeAssignModalBtn = document.getElementById('closeAssignModal');
    const cancelAssignBtn = document.getElementById('cancelAssign');
    const confirmAssignBtn = document.getElementById('confirmAssign');
    const assignUserSelect = document.getElementById('assignUserSelect');

    const toggleHistoryBtn = document.getElementById('toggleHistory');
    const historySection = document.getElementById('historySection');
    const historyTableBody = document.getElementById('historyTableBody');

    let currentUser = null;
    let rooms = [];
    let maintenanceStaff = [];
    let taskBeingAssigned = null;

    async function init() {
        currentUser = await validateJwt();
        rooms = (await getAllRooms()) || [];
        const users = (await getAllUsers()) || [];
        maintenanceStaff = users.filter(u => u.role === 'MANTENIMIENTO' && u.isActive !== false);

        populateRoomSelect();
        populateAssignSelect();
        await loadTasks();
    }

    function populateRoomSelect() {
        const placeholder = `<option value="">Selecciona una habitación</option>`;
        reportRoomSelect.innerHTML = placeholder + rooms
            .sort((a, b) => a.number - b.number)
            .map(r => `<option value="${r.id}">NRO ${r.number} - ${r.floor} - ${r.type}</option>`)
            .join('');
    }

    function populateAssignSelect() {
        if (maintenanceStaff.length === 0) {
            assignUserSelect.innerHTML = `<option value="">No hay personal de mantenimiento registrado</option>`;
            return;
        }
        assignUserSelect.innerHTML = maintenanceStaff
            .map(u => `<option value="${u.id}">${u.username}</option>`)
            .join('');
    }

    function getFilters() {
        return {
            floor: floorFilter.value,
            type: typeFilter.value,
            priority: priorityFilter.value,
        };
    }

    function matchesFilters(task, filters) {
        if (filters.floor !== 'Todos' && task.room?.floor !== filters.floor) return false;
        if (filters.type !== 'Todos' && task.type !== filters.type) return false;
        if (filters.priority !== 'Todos' && task.priority !== filters.priority) return false;
        return true;
    }

    async function loadTasks() {
        try {
            const allTasks = (await getAllTasks()) || [];
            const filters = getFilters();
            const filtered = allTasks.filter(t => matchesFilters(t, filters));
            renderBoard(filtered);
            renderHistory(filtered);
        } catch (error) {
            console.error('Error loading housekeeping tasks:', error);
            showAlert('error', 'Error', 'No se pudieron cargar las tareas de mantenimiento.');
        }
    }

    function isToday(dateString) {
        if (!dateString) return false;
        const d = new Date(dateString);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }

    function renderBoard(tasks) {
        const pendientes = tasks.filter(t => t.status === 'PENDIENTE');
        const enProceso = tasks.filter(t => t.status === 'EN_PROGRESO');
        const completadasHoy = tasks.filter(t => t.status === 'COMPLETADA' && isToday(t.completedAt));

        document.getElementById('countPendiente').textContent = pendientes.length;
        document.getElementById('countEnProceso').textContent = enProceso.length;
        document.getElementById('countCompletada').textContent = completadasHoy.length;

        renderColumn('columnPendiente', pendientes);
        renderColumn('columnEnProceso', enProceso);
        renderColumn('columnCompletada', completadasHoy);
    }

    function renderColumn(containerId, tasks) {
        const container = document.getElementById(containerId);
        if (tasks.length === 0) {
            container.innerHTML = `<div class="hk-empty">Sin tareas</div>`;
            return;
        }
        container.innerHTML = tasks.map(taskCardHTML).join('');
        attachCardListeners(container);
    }

    function taskCardHTML(task) {
        const typeClass = task.type === 'MANTENIMIENTO' ? 'tipo-mantenimiento' : '';
        const typeLabel = task.type === 'MANTENIMIENTO' ? 'Mantenimiento' : 'Limpieza';
        const priorityLabel = task.priority.charAt(0) + task.priority.slice(1).toLowerCase();
        const assignedLabel = task.assignedTo ? `<div class="hk-task-assigned"><i class="fas fa-user"></i> ${task.assignedTo.username}</div>` : '';
        const descriptionLabel = task.description ? `<div class="hk-task-description">${task.description}</div>` : '';

        let actions = '';
        if (task.status === 'PENDIENTE') {
            actions = `
                <button class="hk-btn-start" data-action="start" data-id="${task.id}">Iniciar</button>
                <button class="hk-btn-assign" data-action="assign" data-id="${task.id}">Asignar</button>
                <button class="hk-btn-cancel" data-action="cancel" data-id="${task.id}">Cancelar</button>
            `;
        } else if (task.status === 'EN_PROGRESO') {
            actions = `
                <button class="hk-btn-complete" data-action="complete" data-id="${task.id}">Completar</button>
                <button class="hk-btn-assign" data-action="assign" data-id="${task.id}">Reasignar</button>
            `;
        }

        return `
            <div class="hk-task-card ${typeClass}">
                <div class="hk-task-card-header">
                    <span class="hk-room-number">NRO ${task.room?.number ?? '-'}</span>
                    <span class="hk-priority ${task.priority.toLowerCase()}">${priorityLabel}</span>
                </div>
                <div class="hk-task-type">${typeLabel} · Piso ${task.room?.floor ?? '-'}</div>
                ${descriptionLabel}
                ${assignedLabel}
                <div class="hk-task-actions">${actions}</div>
            </div>
        `;
    }

    function attachCardListeners(container) {
        container.querySelectorAll('button[data-action]').forEach(btn => {
            const id = parseInt(btn.getAttribute('data-id'), 10);
            const action = btn.getAttribute('data-action');
            btn.addEventListener('click', () => handleAction(action, id));
        });
    }

    async function handleAction(action, id) {
        if (action === 'start') {
            await startTask(id);
            showAlert('success', 'Tarea iniciada', '', 1200);
            await loadTasks();
        } else if (action === 'complete') {
            await completeTask(id);
            showAlert('success', 'Tarea completada', '', 1200);
            await loadTasks();
        } else if (action === 'cancel') {
            const result = await Swal.fire({
                icon: 'question',
                title: '¿Cancelar esta tarea?',
                showConfirmButton: true,
                confirmButtonText: 'Sí, cancelar',
                showCancelButton: true,
                cancelButtonText: 'Volver',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
            if (result.isConfirmed) {
                await cancelTask(id);
                await loadTasks();
            }
        } else if (action === 'assign') {
            taskBeingAssigned = id;
            if (maintenanceStaff.length === 0) {
                showAlert('warning', 'Sin personal disponible', 'No hay usuarios con rol MANTENIMIENTO registrados.', 2200);
                return;
            }
            assignModal.style.display = 'block';
        }
    }

    function renderHistory(tasks) {
        const sorted = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (sorted.length === 0) {
            historyTableBody.innerHTML = `<tr><td colspan="8" class="hk-empty">Sin registros</td></tr>`;
            return;
        }
        historyTableBody.innerHTML = sorted.map(t => `
            <tr>
                <td>${t.room?.number ?? '-'}</td>
                <td>${t.type === 'MANTENIMIENTO' ? 'Mantenimiento' : 'Limpieza'}</td>
                <td>${t.priority}</td>
                <td>${t.status.replace('_', ' ')}</td>
                <td>${t.assignedTo?.username ?? '-'}</td>
                <td>${t.description ?? '-'}</td>
                <td>${new Date(t.createdAt).toLocaleString()}</td>
                <td>${t.completedAt ? new Date(t.completedAt).toLocaleString() : '-'}</td>
            </tr>
        `).join('');
    }

    // --- Modal: Reportar incidencia ---
    openReportModalBtn.addEventListener('click', () => {
        reportRoomSelect.value = '';
        reportDescription.value = '';
        reportPrioritySelect.value = 'MEDIA';
        clearFieldError('reportRoomSelect');
        reportModal.style.display = 'block';
    });
    closeReportModalBtn.addEventListener('click', () => reportModal.style.display = 'none');
    cancelReportBtn.addEventListener('click', () => reportModal.style.display = 'none');
    reportRoomSelect.addEventListener('change', () => clearFieldError('reportRoomSelect'));
    confirmReportBtn.addEventListener('click', async () => {
        const roomId = parseInt(reportRoomSelect.value, 10);
        if (!roomId) {
            showFieldError('reportRoomSelect', 'Selecciona una habitación.');
            return;
        }
        clearFieldError('reportRoomSelect');
        await createTask({
            roomId,
            type: 'MANTENIMIENTO',
            priority: reportPrioritySelect.value,
            description: reportDescription.value || null,
            createdById: currentUser?.id ?? null,
        });
        reportModal.style.display = 'none';
        showAlert('success', 'Incidencia reportada', 'La habitación fue marcada como fuera de servicio.', 1800);
        await loadTasks();
    });

    // --- Modal: Asignar ---
    closeAssignModalBtn.addEventListener('click', () => assignModal.style.display = 'none');
    cancelAssignBtn.addEventListener('click', () => assignModal.style.display = 'none');
    confirmAssignBtn.addEventListener('click', async () => {
        const userId = parseInt(assignUserSelect.value, 10);
        if (!userId || !taskBeingAssigned) {
            assignModal.style.display = 'none';
            return;
        }
        await assignTask(taskBeingAssigned, userId);
        assignModal.style.display = 'none';
        showAlert('success', 'Tarea asignada', '', 1400);
        await loadTasks();
    });

    // --- Filtros ---
    [floorFilter, typeFilter, priorityFilter].forEach(select => {
        select.addEventListener('change', loadTasks);
    });

    // --- Historial ---
    toggleHistoryBtn.addEventListener('click', () => {
        const isHidden = historySection.style.display === 'none';
        historySection.style.display = isHidden ? 'block' : 'none';
        toggleHistoryBtn.innerHTML = isHidden
            ? '<i class="fas fa-clock-rotate-left"></i> Ocultar historial'
            : '<i class="fas fa-clock-rotate-left"></i> Ver historial completo';
    });

    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (event) => {
        if (event.target === reportModal) reportModal.style.display = 'none';
        if (event.target === assignModal) assignModal.style.display = 'none';
    });

    init();
}
