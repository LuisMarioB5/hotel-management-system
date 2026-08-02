import { createBooking } from '../integrations/booking.integration.js';

document.addEventListener('DOMContentLoaded', async () => {
    const clienteIdInput = document.getElementById('cliente-id');
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const telefonoInput = document.getElementById('telefono');
    const correoInput = document.getElementById('correo');
    const minPriceSelect = document.getElementById('min_price');
    const maxPriceSelect = document.getElementById('max_price');
    const registrarBtn = document.getElementById('registrarBtn');
    const amenitiesContainer = document.getElementById('amenities-container');

    const priceWeightCheckboxes = document.querySelectorAll('input[name="price_weight_level"]');
    priceWeightCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            priceWeightCheckboxes.forEach(cb => {
                if (cb !== checkbox) cb.checked = false;
            });
        });
    });

    let lastClientId = null;

    // Se consulta el contenedor en fresco cada vez porque loadAmenities()
    // reconstruye el DOM de las amenidades (y con él, #amenity-summary).
    const renderAmenitySummary = () => {
        const summaryEl = document.getElementById('amenity-summary');
        if (!summaryEl) return;

        const selected = Array.from(amenitiesContainer.querySelectorAll('.amenity-chip-checkbox:checked'));

        if (selected.length === 0) {
            summaryEl.innerHTML = '<span class="amenity-summary-empty">Aún no has marcado ninguna amenidad.</span>';
            return;
        }

        summaryEl.innerHTML = selected.map(checkbox => {
            const chip = checkbox.closest('.amenity-chip');
            const name = chip?.dataset.name || '';
            const select = chip?.querySelector('select');
            const level = select ? select.value : '1';
            return `
                <span class="amenity-summary-chip">
                    ${name}
                    <span class="amenity-summary-level">★${level}</span>
                    <button type="button" class="amenity-summary-remove" data-amenity-id="${checkbox.value}" aria-label="Quitar ${name}">×</button>
                </span>
            `;
        }).join('');

        summaryEl.querySelectorAll('.amenity-summary-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const checkbox = document.getElementById(`amenity-${btn.dataset.amenityId}`);
                if (checkbox) {
                    checkbox.checked = false;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        });
    };

    const resetForm = () => {
        minPriceSelect.value = minPriceSelect.options[0].value;
        maxPriceSelect.value = maxPriceSelect.options[maxPriceSelect.options.length - 1].value;
        priceWeightCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.name === 'price_weight_level') return;
            checkbox.checked = false;
            const preferenceSelect = checkbox.closest('.amenity-chip')?.querySelector('select');
            if (preferenceSelect) {
                preferenceSelect.disabled = true;
                preferenceSelect.value = '1';
            }
        });
        renderAmenitySummary();
    };

    const loadAmenities = async () => {
        try {
            const response = await fetch('http://localhost:3000/amenities/list', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar las amenidades');
            }

            const categories = await response.json();

            const tabsHtml = categories.map((category, index) => `
                <button type="button" class="amenity-tab${index === 0 ? ' active' : ''}" data-category-tab="${category.id}">
                    ${category.name}
                </button>
            `).join('');

            const panelsHtml = categories.map((category, index) => `
                <div class="amenity-panel${index === 0 ? ' active' : ''}" data-category-panel="${category.id}">
                    ${category.options.map(option => `
                        <div class="amenity-group">
                            <span class="amenity-group-label">${option.name}</span>
                            <div class="amenity-chip-row">
                                ${option.amenities.map(amenity => `
                                    <div class="amenity-chip" data-name="${amenity.value}">
                                        <input type="checkbox" class="amenity-chip-checkbox" id="amenity-${amenity.id}" value="${amenity.id}">
                                        <label for="amenity-${amenity.id}" class="amenity-chip-label">
                                            <span class="amenity-chip-name">${amenity.value}</span>
                                            <span class="amenity-chip-cost">RD$${amenity.cost.toLocaleString()}</span>
                                        </label>
                                        <select class="preference-level amenity-chip-weight" name="preference-${amenity.id}" disabled title="¿Qué tan importante es esta amenidad para ti?">
                                            ${[1, 2, 3, 4, 5].map(i => `<option value="${i}">${i}</option>`).join('')}
                                        </select>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('');

            amenitiesContainer.innerHTML = `
                <div class="amenity-summary" id="amenity-summary"></div>
                <div class="amenity-tabs" id="amenity-tabs">${tabsHtml}</div>
                <div class="amenity-panels" id="amenity-panels">${panelsHtml}</div>
            `;

            amenitiesContainer.querySelectorAll('.amenity-chip-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const preferenceSelect = checkbox.closest('.amenity-chip')?.querySelector('select');
                    if (preferenceSelect) {
                        preferenceSelect.disabled = !checkbox.checked;
                    }
                    renderAmenitySummary();
                });
            });

            amenitiesContainer.querySelectorAll('.amenity-chip-weight').forEach(select => {
                select.addEventListener('change', renderAmenitySummary);
            });

            document.getElementById('amenity-tabs').addEventListener('click', (event) => {
                const tabBtn = event.target.closest('.amenity-tab');
                if (!tabBtn) return;

                document.querySelectorAll('.amenity-tab').forEach(tab => tab.classList.remove('active'));
                tabBtn.classList.add('active');

                const categoryId = tabBtn.dataset.categoryTab;
                document.querySelectorAll('.amenity-panel').forEach(panel => {
                    panel.classList.toggle('active', panel.dataset.categoryPanel === categoryId);
                });
            });

            renderAmenitySummary();
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: `No se pudieron cargar las amenidades: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'Aceptar',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
        }
    };

    const loadPriceRanges = async () => {
        try {
            const response = await fetch('http://localhost:3000/rooms/price-range', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar los rangos de precios');
            }

            const { minPrice, maxPrice } = await response.json();

            const minPriceNum = parseInt(minPrice);
            const maxPriceNum = parseInt(maxPrice);

            const step = Math.ceil((maxPriceNum - minPriceNum) / 10);
            for (let price = minPriceNum; price <= maxPriceNum; price += step) {
                const minOption = document.createElement('option');
                minOption.value = price.toString();
                minOption.textContent = `RD$${price.toLocaleString()}`;
                minPriceSelect.appendChild(minOption);

                const maxOption = document.createElement('option');
                maxOption.value = price.toString();
                maxOption.textContent = `RD$${price.toLocaleString()}`;
                maxPriceSelect.appendChild(maxOption);
            }

            minPriceSelect.value = minPriceNum.toString();
            maxPriceSelect.value = maxPriceNum.toString();

            minPriceSelect.addEventListener('change', () => {
                const minPrice = parseInt(minPriceSelect.value);
                const maxPrice = parseInt(maxPriceSelect.value);
                if (minPrice > maxPrice) {
                    maxPriceSelect.value = minPrice.toString();
                }
            });

            maxPriceSelect.addEventListener('change', () => {
                const minPrice = parseInt(minPriceSelect.value);
                const maxPrice = parseInt(maxPriceSelect.value);
                if (maxPrice < minPrice) {
                    minPriceSelect.value = maxPrice.toString();
                }
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: `No se pudieron cargar los rangos de precios: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'Aceptar',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
        }
    };

    const loadClientPreferences = async (customerId) => {
        try {
            const response = await fetch(`http://localhost:3000/preferences/${customerId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar las preferencias del cliente');
            }

            const preferences = await response.json();
            const { configuration, amenities } = preferences;

            if (configuration.min_cost && configuration.max_cost) {
                const minOptions = Array.from(minPriceSelect.options).map(opt => parseInt(opt.value));
                let closestMin = minOptions.reduce((prev, curr) =>
                    Math.abs(curr - parseFloat(configuration.min_cost)) < Math.abs(prev - parseFloat(configuration.min_cost)) ? curr : prev
                );
                minPriceSelect.value = closestMin.toString();

                const maxOptions = Array.from(maxPriceSelect.options).map(opt => parseInt(opt.value));
                let closestMax = maxOptions.reduce((prev, curr) =>
                    Math.abs(curr - parseFloat(configuration.max_cost)) < Math.abs(prev - parseFloat(configuration.max_cost)) ? curr : prev
                );
                maxPriceSelect.value = closestMax.toString();
            } else {
                minPriceSelect.value = minPriceSelect.options[0].value;
                maxPriceSelect.value = maxPriceSelect.options[maxPriceSelect.options.length - 1].value;
            }

            const weightLevel = parseInt(configuration.weight_level);
            priceWeightCheckboxes.forEach(checkbox => {
                checkbox.checked = parseInt(checkbox.value) === weightLevel;
            });

            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                if (checkbox.name === 'price_weight_level') return;
                checkbox.checked = false;
                const preferenceSelect = checkbox.closest('.amenity-chip')?.querySelector('select');
                if (preferenceSelect) {
                    preferenceSelect.disabled = true;
                    preferenceSelect.value = '1';
                }
            });

            if (amenities && amenities.length > 0) {
                amenities.forEach(amenity => {
                    const checkbox = document.getElementById(`amenity-${amenity.amenity_id}`);
                    if (checkbox) {
                        checkbox.checked = true;
                        const preferenceSelect = document.querySelector(`select[name="preference-${amenity.amenity_id}"]`);
                        if (preferenceSelect) {
                            preferenceSelect.disabled = false;
                            preferenceSelect.value = amenity.preference_level.toString();
                        }
                    }
                });
            }

            renderAmenitySummary();
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: `No se pudieron cargar las preferencias: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'Aceptar',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
        }
    };

    await loadAmenities();
    await loadPriceRanges();

    setInterval(() => {
        const currentClientId = clienteIdInput.value;
        if (currentClientId && currentClientId !== lastClientId && parseInt(currentClientId) > 0) {
            lastClientId = currentClientId;
            resetForm();
            loadClientPreferences(parseInt(currentClientId));
        }
    }, 1000);

    registrarBtn.addEventListener('click', async () => {
        const customerId = parseInt(clienteIdInput.value);
        if (!customerId || customerId <= 0) {
            Swal.fire({
                title: 'Error',
                text: 'Por favor, seleccione un cliente válido.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
            return;
        }

        const customerEmail = correoInput.value;
        if (!customerEmail) {
            Swal.fire({
                title: 'Error',
                text: 'El cliente no tiene un correo electrónico registrado.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
            return;
        }

        const minCost = parseInt(minPriceSelect.value);
        const maxCost = parseInt(maxPriceSelect.value);
        const selectedWeightCheckbox = Array.from(priceWeightCheckboxes).find(cb => cb.checked);
        const priceWeightLevel = selectedWeightCheckbox ? parseInt(selectedWeightCheckbox.value) : 0;

        const selectedAmenities = [];
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            if (checkbox.name === 'price_weight_level') return;
            const amenityId = parseInt(checkbox.value);
            const preferenceLevel = parseInt(document.querySelector(`select[name="preference-${amenityId}"]`).value);
            selectedAmenities.push({
                amenity_id: amenityId,
                preference_level: preferenceLevel,
            });
        });

        const formData = {
            customer_id: customerId,
            min_cost: minCost,
            max_cost: maxCost,
            weight_level: priceWeightLevel,
            amenities: selectedAmenities,
        };

        try {
            Swal.fire({
                title: 'Guardando Preferencias',
                html: '<i class="fas fa-cog fa-spin fa-2x"></i><br><br>Por favor, espere...',
                allowOutsideClick: false,
                showConfirmButton: false,
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const response = await fetch('http://localhost:3000/preferences/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al guardar las preferencias');
            }

            await response.json();

            Swal.close();

            const result = await Swal.fire({
                title: 'Cuestionario guardado correctamente',
                text: '¿Desea generar una habitación adecuada a sus gustos?',
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: 'Sí, generar',
                cancelButtonText: 'No, gracias',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });

            if (result.isConfirmed) {
                try {
                    const offerResponse = await fetch('http://localhost:3000/offers/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            numCustomers: 0,
                            isFrequentGuest: 0,
                            specificCustomer: customerId,
                            roomType: '',
                            minStayDuration: 1,
                            seasonName: '',
                        }),
                    });

                    if (!offerResponse.ok) {
                        const errorData = await offerResponse.json();
                        throw new Error(errorData.error || 'Error al generar la oferta');
                    }

                    const { offers, warningMessage } = await offerResponse.json();
                    if (!Array.isArray(offers)) {
                        throw new Error('La respuesta del servidor no contiene un arreglo de ofertas válido.');
                    }
                    if (offers.length === 0) {
                        throw new Error(warningMessage || 'No se encontraron habitaciones adecuadas');
                    }

                    const offer = offers[0];
                    const { room_id, room_number, price, total_score } = offer;

                    const amenitiesResponse = await fetch(`http://localhost:3000/rooms/${room_id}/amenities`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!amenitiesResponse.ok) {
                        throw new Error('Error al obtener las amenidades de la habitación');
                    }

                    const roomAmenities = await amenitiesResponse.json();

                    let amenitiesHtml = '';
                    roomAmenities.forEach(category => {
                        amenitiesHtml += `
                            <div class="amenity-category">
                                <div class="option-label">
                                    ${category.name}
                                    <span class="toggle-icon">▼</span>
                                </div>
                                <div class="amenity-suboptions">
                        `;
                        category.options.forEach(option => {
                            if (option.amenities.length > 0) {
                                amenitiesHtml += `
                                    <div class="option-name">${option.name}</div>
                                `;
                                option.amenities.forEach(amenity => {
                                    amenitiesHtml += `
                                        <div class="suboption">
                                            ${amenity.value}
                                        </div>
                                    `;
                                });
                            }
                        });
                        amenitiesHtml += `
                                </div>
                            </div>
                        `;
                    });

                    const reservationModal = await Swal.fire({
                        title: `Habitación Sugerida: ${room_number}`,
                        html: `
                            <div style="text-align: left;">
                                <h3>Detalles de la Habitación</h3>
                                <div class="amenities-container" id="modal-amenities-container">${amenitiesHtml}</div>
                                <p><strong>Precio por Noche:</strong> RD$${price.toLocaleString()}</p>
                                <hr>
                                <h3>Seleccione las Fechas de su Estancia</h3>
                                <div class="date-input-container">
                                    <label for="checkInDate">Fecha de Entrada:</label>
                                    <div class="date-input-wrapper">
                                        <input type="date" id="checkInDate" class="date-input">
                                        <i class="fas fa-calendar-alt date-icon"></i>
                                    </div>
                                </div>
                                <div class="date-input-container">
                                    <label for="checkOutDate">Fecha de Salida:</label>
                                    <div class="date-input-wrapper">
                                        <input type="date" id="checkOutDate" class="date-input">
                                        <i class="fas fa-calendar-alt date-icon"></i>
                                    </div>
                                </div>
                                <p><strong>Costo Total:</strong> <span id="totalCost">Seleccione las fechas</span></p>
                            </div>
                        `,
                        showCancelButton: true,
                        confirmButtonText: 'Reservar',
                        cancelButtonText: 'Cancelar',
                        width: '600px',
                        heightAuto: false,
                        customClass: {
                            container: 'swal-container',
                            confirmButton: 'swal-confirm-btn',
                            cancelButton: 'swal-cancel-btn',
                        },
                        preConfirm: async () => {
                            const checkInDateInput = document.getElementById('checkInDate');
                            const checkOutDateInput = document.getElementById('checkOutDate');

                            const checkInDate = checkInDateInput.value;
                            const checkOutDate = checkOutDateInput.value;

                            if (!checkInDate || !checkOutDate) {
                                Swal.showValidationMessage('Por favor, seleccione las fechas de entrada y salida.');
                                return false;
                            }

                            const checkIn = new Date(checkInDate);
                            const checkOut = new Date(checkOutDate);

                            if (checkOut <= checkIn) {
                                Swal.showValidationMessage('La fecha de salida debe ser posterior a la fecha de entrada.');
                                return false;
                            }

                            const timeDiff = checkOut - checkIn;
                            const totalStayDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

                            const stayCost = totalStayDays * price;
                            const totalCost = stayCost;

                            try {
                                const bookingData = {
                                    customerId: customerId,
                                    roomId: room_id,
                                    checkInDate: checkInDate,
                                    checkOutDate: checkOutDate,
                                    totalStayDays: totalStayDays,
                                    stayCost: stayCost,
                                    totalCost: totalCost,
                                    cashAdvance: 0.00,
                                    priceAdjustment: 0.00,
                                    details: null,
                                    status: 'PENDIENTE',
                                    isActive: true,
                                };

                                const response = await fetch('http://localhost:3000/bookings/create-and-notify', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        bookingData: bookingData,
                                        customerEmail: customerEmail,
                                        roomNumber: room_number,
                                    }),
                                });

                                if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.message || 'Error al crear la reserva y enviar el correo');
                                }

                                const result = await response.json();
                                return result.booking;
                            } catch (error) {
                                Swal.showValidationMessage(`Error al crear la reserva: ${error.message}`);
                                return false;
                            }
                        },
                        didOpen: () => {
                            const modalAmenitiesContainer = document.getElementById('modal-amenities-container');
                            modalAmenitiesContainer.addEventListener('click', (event) => {
                                const optionLabel = event.target.closest('.option-label');
                                if (optionLabel) {
                                    const suboptions = optionLabel.nextElementSibling;
                                    const isOpen = suboptions.classList.toggle('open');
                                    const toggleIcon = optionLabel.querySelector('.toggle-icon');
                                    toggleIcon.classList.toggle('open', isOpen);
                                }
                            });

                            const checkInDateInput = document.getElementById('checkInDate');
                            const checkOutDateInput = document.getElementById('checkOutDate');
                            const totalCostSpan = document.getElementById('totalCost');

                            const calculateTotalCost = () => {
                                const checkInDate = new Date(checkInDateInput.value);
                                const checkOutDate = new Date(checkOutDateInput.value);

                                if (checkInDate && checkOutDate && checkOutDate > checkInDate) {
                                    const timeDiff = checkOutDate - checkInDate;
                                    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                                    const totalCost = days * price;
                                    totalCostSpan.textContent = `RD$${totalCost.toLocaleString()}`;
                                } else {
                                    totalCostSpan.textContent = 'Seleccione fechas válidas';
                                }
                            };

                            checkInDateInput.addEventListener('change', calculateTotalCost);
                            checkOutDateInput.addEventListener('change', calculateTotalCost);

                            const today = new Date().toISOString().split('T')[0];
                            checkInDateInput.setAttribute('min', today);

                            checkInDateInput.addEventListener('change', () => {
                                const checkInDate = new Date(checkInDateInput.value);
                                const minCheckOutDate = new Date(checkInDate);
                                minCheckOutDate.setDate(checkInDate.getDate() + 1);
                                checkOutDateInput.setAttribute('min', minCheckOutDate.toISOString().split('T')[0]);
                            });
                        },
                    });

                    if (reservationModal.isConfirmed) {
                        await Swal.fire({
                            title: '¡Reserva creada correctamente!',
                            text: 'Se ha enviado un correo al cliente para confirmar o cancelar la reserva.',
                            icon: 'success',
                            confirmButtonText: 'Aceptar',
                            heightAuto: false,
                            customClass: {
                                container: 'swal-container',
                            },
                        });

                        resetForm();
                        lastClientId = null;
                    }
                } catch (error) {
                    Swal.fire({
                        title: 'Error',
                        text: `No se pudo generar la recomendación: ${error.message}`,
                        icon: 'error',
                        confirmButtonText: 'Aceptar',
                        heightAuto: false,
                        customClass: {
                            container: 'swal-container',
                        },
                    });
                }
            }
        } catch (error) {
            Swal.close();

            Swal.fire({
                title: 'Error',
                text: `No se pudieron guardar las preferencias: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'Aceptar',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });
        }
    });
});