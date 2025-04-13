document.addEventListener('DOMContentLoaded', () => {
  const generateButton = document.getElementById('topservicios');
  const sendOffersButton = document.getElementById('enviarreportes');
  const offersTableBody = document.querySelector('.user-table tbody');
  let generatedOffers = [];

  // Estilo para los botones de acción
  const style = document.createElement('style');
  style.textContent = `
    .action-btn {
      border: none;
      background: none;
      cursor: pointer;
      padding: 5px;
      margin: 0 5px;
      transition: transform 0.2s, color 0.2s;
    }
    .action-btn i {
      font-size: 16px;
    }
    .action-btn.remove-offer i {
      color: #dc3545;
    }
    .action-btn:hover {
      transform: scale(1.2);
    }
  `;
  document.head.appendChild(style);

  // Evento para generar ofertas
  generateButton.addEventListener('click', async () => {
    const numCustomers = parseInt(document.getElementById('topProSer').value);
    const frequency = document.getElementById('topcategory').value;
    const isFrequentGuest = frequency === 'HABITUAL' ? 1 : 0;
    const specificCustomer = 0; // Nuevo parámetro, modo 1 (asignaciones aleatorias)

    if (!numCustomers || numCustomers <= 0) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, ingrese un número válido de clientes.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        heightAuto: false,
        customClass: {
          container: 'swal-container',
        },
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Generando Ofertas',
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

      // Realizamos la solicitud al backend usando POST, incluyendo el nuevo parámetro
      const response = await fetch('http://localhost:3000/offers/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numCustomers, isFrequentGuest, specificCustomer }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar las ofertas');
      }

      const offers = await response.json();

      if (!Array.isArray(offers) || offers.length === 0) {
        throw new Error('No se recibieron ofertas válidas');
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      Swal.close();

      Swal.fire({
        title: 'Ofertas Generadas Exitosamente',
        text: `Se generaron ${offers.length} ofertas.`,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        heightAuto: false,
        customClass: {
          container: 'swal-container',
        },
      });

      // Limpiar la tabla antes de mostrar las nuevas ofertas
      offersTableBody.innerHTML = '';

      // Generar las fechas de validez
      const currentDate = new Date();
      const offerDate = currentDate.toLocaleDateString('es-ES');
      const validFrom = currentDate.toISOString().split('T')[0];
      const validToDate = new Date(currentDate);
      validToDate.setDate(currentDate.getDate() + 7); // Oferta válida por 7 días
      const validTo = validToDate.toISOString().split('T')[0];

      // Mapear las ofertas recibidas del backend
      generatedOffers = offers.map(offer => {
        const discountPercentage = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
        const originalPrice = parseFloat(offer.price) || 0;
        const discountAmount = (originalPrice * discountPercentage) / 100;
        const offerPrice = originalPrice - discountAmount;

        return {
          customer_id: offer.customer_id,
          room_id: offer.room_id,
          discount: discountPercentage,
          validFrom: validFrom,
          validTo: validTo,
          status: 'PENDIENTE',
          details: offer.details,
          price: offerPrice,
          email: offer.email,
          room_number: offer.room_number,
          name: offer.name,
        };
      });

      // Mostrar las ofertas en la tabla
      generatedOffers.forEach(offer => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="display: none;" class="customer-id">${offer.customer_id || ''}</td>
          <td>${offer.name || 'Desconocido'}</td>
          <td>${offer.email || 'Sin correo'}</td>
          <td style="display: none;" class="room-id">${offer.room_id || ''}</td>
          <td>${offer.room_number || 'Sin asignar'}</td>
          <td>${offer.details || 'Sin detalles'}</td>
          <td style="display: none;" class="original-price">${offer.price}</td>
          <td>$${offer.price.toFixed(2)} (${offer.discount}% OFF)</td>
          <td>${offerDate}</td>
          <td style="display: none;" class="valid-to">${offer.validTo}</td>
          <td>
            <button class="action-btn remove-offer"><i class="fas fa-times"></i></button>
          </td>
        `;
        offersTableBody.appendChild(row);
      });

      // Actualizar la información de paginación
      const paginationLabel = document.querySelector('.pagination-info label');
      paginationLabel.textContent = `Mostrando ${generatedOffers.length} de ${generatedOffers.length} registros`;

    } catch (error) {
      Swal.close();

      Swal.fire({
        title: 'Error',
        text: `No se pudieron generar las ofertas: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        heightAuto: false,
        customClass: {
          container: 'swal-container',
        },
      });
    }
  });

  // Evento para enviar ofertas (sin cambios aquí)
  sendOffersButton.addEventListener('click', async () => {
    if (!Array.isArray(generatedOffers) || generatedOffers.length === 0) {
      Swal.fire({
        title: 'No hay ofertas',
        text: 'Por favor, genera ofertas antes de enviarlas.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        heightAuto: false,
        customClass: {
          container: 'swal-container',
        },
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Enviando Ofertas',
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

      // Excluimos el campo 'name' de las ofertas enviadas
      const offersToSend = generatedOffers.map(({ name, ...offer }) => offer);

      // Enviar las ofertas al backend
      const response = await fetch('http://localhost:3000/offers/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offersToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar las ofertas');
      }

      const result = await response.json();

      Swal.close();

      let message = 'Las ofertas han sido guardadas y enviadas a los clientes.';
      if (result.emailErrors && result.emailErrors.length > 0) {
        const failedEmails = result.emailErrors.map(err => err.email).join(', ');
        message += `<br><br>Advertencia: No se pudieron enviar correos a: ${failedEmails}.`;
      }

      Swal.fire({
        title: 'Ofertas Enviadas',
        html: message,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        heightAuto: false,
        customClass: {
          container: 'swal-container',
        },
      });

      // Limpiar la tabla y el array de ofertas generadas
      generatedOffers = [];
      offersTableBody.innerHTML = '';
      const paginationLabel = document.querySelector('.pagination-info label');
      paginationLabel.textContent = `Mostrando 0 de 0 registros`;

    } catch (error) {
      Swal.close();

      Swal.fire({
        title: 'Error',
        text: `No se pudieron enviar las ofertas: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        heightAuto: false,
        customClass: {
          container: 'swal-container',
        },
      });
    }
  });

  // Evento para eliminar una oferta de la tabla (sin cambios aquí)
  offersTableBody.addEventListener('click', (event) => {
    const row = event.target.closest('tr');
    if (!row) return;

    if (event.target.closest('.remove-offer')) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta oferta será eliminada de la tabla.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        heightAuto: false,
        customClass: {
          container: 'swal-container',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const index = Array.from(offersTableBody.children).indexOf(row);
          generatedOffers.splice(index, 1);
          row.remove();

          Swal.fire({
            title: 'Oferta Eliminada',
            text: 'La oferta ha sido eliminada de la tabla.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            heightAuto: false,
            customClass: {
              container: 'swal-container',
            },
          });

          const remainingRows = offersTableBody.querySelectorAll('tr').length;
          const paginationLabel = document.querySelector('.pagination-info label');
          paginationLabel.textContent = `Mostrando ${remainingRows} de ${remainingRows} registros`;
        }
      });
    }
  });
});