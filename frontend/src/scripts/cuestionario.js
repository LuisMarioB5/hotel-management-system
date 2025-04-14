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

    // Asegurarse de que solo un checkbox de price_weight_level esté marcado a la vez
    const priceWeightCheckboxes = document.querySelectorAll('input[name="price_weight_level"]');
    priceWeightCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                priceWeightCheckboxes.forEach(cb => {
                    if (cb !== checkbox) cb.checked = false;
                });
            }
        });
    });

    // Variable para almacenar el último ID de cliente conocido
    let lastClientId = null;

    // Función para cargar las amenidades desde el backend
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
    
            // Limpiar el contenedor de amenidades antes de renderizar
            amenitiesContainer.innerHTML = '';
    
            // Generar las categorías y sus opciones
            categories.forEach(category => {
                const categoryDiv = document.createElement('div');
                categoryDiv.classList.add('amenity-category');
    
                const categoryTitle = document.createElement('h3');
                categoryTitle.textContent = category.name;
                categoryDiv.appendChild(categoryTitle);
    
                category.options.forEach(option => {
                    const optionDiv = document.createElement('div');
                    optionDiv.classList.add('amenity-option');
    
                    const optionLabel = document.createElement('div');
                    optionLabel.classList.add('option-label');
                    optionLabel.innerHTML = `
                        ${option.name}
                        <span class="toggle-icon">▼</span>
                    `;
                    optionDiv.appendChild(optionLabel);
    
                    const suboptionsDiv = document.createElement('div');
                    suboptionsDiv.classList.add('amenity-suboptions');
    
                    // Generar las subopciones (amenidades) para esta opción
                    option.amenities.forEach(amenity => {
                        
                        const suboptionDiv = document.createElement('div');
                        suboptionDiv.classList.add('suboption');
    
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = `amenity-${amenity.id}`;
                        checkbox.value = amenity.id;
    
                        const label = document.createElement('label');
                        label.htmlFor = `amenity-${amenity.id}`;
                        label.textContent = `${amenity.value} (RD$${amenity.cost.toLocaleString()})`;
    
                        const preferenceSelect = document.createElement('select');
                        preferenceSelect.classList.add('preference-level');
                        preferenceSelect.name = `preference-${amenity.id}`;
                        preferenceSelect.disabled = true;
                        preferenceSelect.title = '¿Qué tan importante es esta amenidad para ti?'; // Tooltip
                        for (let i = 1; i <= 5; i++) {
                            const option = document.createElement('option');
                            option.value = i;
                            option.textContent = i;
                            preferenceSelect.appendChild(option);
                        }
    
                        checkbox.addEventListener('change', () => {
                            preferenceSelect.disabled = !checkbox.checked;
                        });
    
                        suboptionDiv.appendChild(checkbox);
                        suboptionDiv.appendChild(label);
                        suboptionDiv.appendChild(preferenceSelect);
                        suboptionsDiv.appendChild(suboptionDiv);
                    });
    
                    // Toggle para mostrar/ocultar las subopciones
                    optionLabel.addEventListener('click', () => {
                        const isOpen = suboptionsDiv.classList.toggle('open');
                        const toggleIcon = optionLabel.querySelector('.toggle-icon');
                        toggleIcon.classList.toggle('open', isOpen);
                    });
    
                    optionDiv.appendChild(suboptionsDiv);
                    categoryDiv.appendChild(optionDiv);
                });
    
                amenitiesContainer.appendChild(categoryDiv);
            });
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

    // Función para cargar los rangos de precios dinámicos desde la tabla rooms
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

            // Convertir los valores a números
            const minPriceNum = parseInt(minPrice);
            const maxPriceNum = parseInt(maxPrice);

            // Generar opciones para min_price y max_price
            const step = Math.ceil((maxPriceNum - minPriceNum) / 10); // Dividimos en 10 pasos
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

            // Establecer valores iniciales
            minPriceSelect.value = minPriceNum.toString();
            maxPriceSelect.value = maxPriceNum.toString();

            // Validar que min_price no sea mayor que max_price
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

    // Función para cargar las preferencias del cliente
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

            // Cargar los valores de client_configuration
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

            // Cargar weight_level
            const weightLevel = parseInt(configuration.weight_level);
            priceWeightCheckboxes.forEach(checkbox => {
                checkbox.checked = parseInt(checkbox.value) === weightLevel;
            });

            // Cargar las amenidades seleccionadas (client_amenities)
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                if (checkbox.name === 'price_weight_level') return; // Ignorar los checkboxes de price_weight_level
                checkbox.checked = false;
                const preferenceSelect = document.querySelector(`select[name="preference-${checkbox.value}"]`);
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
                        } else {
                            console.log(`No se encontró preferenceSelect para amenity_id: ${amenity.amenity_id}`);
                        }
                    } else {
                        console.log(`No se encontró checkbox para amenity_id: ${amenity.amenity_id}`);
                    }
                });
            } else {
                console.log('No se encontraron amenidades para este cliente');
            }
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

    // Cargar las amenidades y los rangos de precios al iniciar
    await loadAmenities(); // Esperar a que las amenidades se carguen
    await loadPriceRanges();

    // Comenzar a observar cambios en cliente-id después de cargar las amenidades
    setInterval(() => {
        const currentClientId = clienteIdInput.value;
        if (currentClientId && currentClientId !== lastClientId && parseInt(currentClientId) > 0) {
            lastClientId = currentClientId;
            loadClientPreferences(parseInt(currentClientId));
        }
    }, 500); // Verificar cada 500ms

    // Manejar el evento de "Guardar"
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

        const minCost = parseInt(minPriceSelect.value);
        const maxCost = parseInt(maxPriceSelect.value);
        const selectedWeightCheckbox = Array.from(priceWeightCheckboxes).find(cb => cb.checked);
        const priceWeightLevel = selectedWeightCheckbox ? parseInt(selectedWeightCheckbox.value) : 0;

        // Recolectar las amenidades seleccionadas y sus niveles de preferencia
        const selectedAmenities = [];
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            if (checkbox.name === 'price_weight_level') return; // Ignorar los checkboxes de price_weight_level
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

            const result = await response.json();

            Swal.close();

            Swal.fire({
                title: 'Preferencias Guardadas',
                text: 'Las preferencias se han guardado exitosamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                heightAuto: false,
                customClass: {
                    container: 'swal-container',
                },
            });

            // Limpiar el formulario
            minPriceSelect.value = minPriceSelect.options[0].value;
            maxPriceSelect.value = maxPriceSelect.options[maxPriceSelect.options.length - 1].value;
            priceWeightCheckboxes.forEach(checkbox => checkbox.checked = false);
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                if (checkbox.name === 'price_weight_level') return;
                checkbox.checked = false;
                const preferenceSelect = document.querySelector(`select[name="preference-${checkbox.value}"]`);
                if (preferenceSelect) {
                    preferenceSelect.disabled = true;
                    preferenceSelect.value = '1';
                }
            });

            // Restablecer lastClientId para permitir cargar nuevas preferencias
            lastClientId = null;
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