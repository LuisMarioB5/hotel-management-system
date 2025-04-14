document.addEventListener('DOMContentLoaded', () => {
  const generateButton = document.getElementById('topservicios');
  const sendOffersButton = document.getElementById('enviarreportes');
  const viewAllOffersButton = document.getElementById('viewAllOffersBtn');
  const offersTableBody = document.querySelector('.user-table tbody');
  const modalOffersTableBody = document.getElementById('offersTableBody');
  const dateFromFilter = document.getElementById('dateFromFilter');
  const monthFilter = document.getElementById('monthFilter');
  const statusFilter = document.getElementById('statusFilter');
  const recordsPerPageSelect = document.getElementById('recordsPerPage');
  const prevPageButton = document.getElementById('prevPage');
  const nextPageButton = document.getElementById('nextPage');
  const paginationLabel = document.getElementById('paginationLabel');
  let generatedOffers = [];
  let filteredOffers = [];
  let currentPage = 1;
  let recordsPerPage = parseInt(recordsPerPageSelect.value);

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

  // Función para limpiar los filtros
  function clearFilters() {
    dateFromFilter.value = '';
    monthFilter.value = '';
    statusFilter.value = '';
    loadOffers();
  }

  // Evento para generar ofertas
  generateButton.addEventListener('click', async () => {
    const numCustomers = parseInt(document.getElementById('topProSer').value);
    const frequency = document.getElementById('topcategory').value;
    const isFrequentGuest = frequency === 'HABITUAL' ? 1 : 0;
    const specificCustomer = 0;

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

      offersTableBody.innerHTML = '';

      const currentDate = new Date();
      const validFrom = currentDate.toISOString().split('T')[0];
      const validToDate = new Date(currentDate);
      validToDate.setDate(currentDate.getDate() + 7);
      const validTo = validToDate.toISOString().split('T')[0];

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

      generatedOffers.forEach(offer => {
        const row = document.createElement('tr');
        const price = typeof offer.price === 'number' ? offer.price : 0;
        row.innerHTML = `
          <td style="display: none;" class="customer-id">${offer.customer_id || ''}</td>
          <td>${offer.name || 'Desconocido'}</td>
          <td>${offer.email || 'Sin correo'}</td>
          <td style="display: none;" class="room-id">${offer.room_id || ''}</td>
          <td>${offer.room_number || 'Sin asignar'}</td>
          <td>${offer.details || 'Sin detalles'}</td>
          <td style="display: none;" class="original-price">${price}</td>
          <td>$${price.toFixed(2)} (${offer.discount}% OFF)</td>
          <td>${currentDate.toLocaleDateString('es-ES')}</td>
          <td style="display: none;" class="valid-to">${offer.validTo}</td>
          <td>
            <button class="action-btn remove-offer"><i class="fas fa-times"></i></button>
          </td>
        `;
        offersTableBody.appendChild(row);
      });

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

      const offersToSend = generatedOffers.map(({ name, ...offer }) => offer);

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

  async function loadOffers() {
    try {
      const params = new URLSearchParams();
      if (dateFromFilter.value) {
        params.append('dateFrom', dateFromFilter.value);
      }
      if (monthFilter.value) params.append('month', monthFilter.value);
      if (statusFilter.value) params.append('status', statusFilter.value);

      const response = await fetch(`http://localhost:3000/offers?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener las ofertas');
      }

      filteredOffers = await response.json();
      currentPage = 1;
      renderOffers();
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: `No se pudieron cargar las ofertas: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        heightAuto: false,
        customClass: {
          container: 'swal-container',
        },
      });
    }
  }

  viewAllOffersButton.addEventListener('click', () => {
    clearFilters();
    document.getElementById('offersModal').style.display = 'flex';
  });

  function renderOffers() {
    modalOffersTableBody.innerHTML = '';

    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const offersToShow = filteredOffers.slice(start, end);

    offersToShow.forEach(offer => {
      const row = document.createElement('tr');
      // Convertimos price a número, manejando casos donde sea cadena o undefined
      const price = parseFloat(offer.price) || 0;
      row.innerHTML = `
        <td>${offer.customer_name || 'Desconocido'}</td>
        <td>${offer.customer_email || 'Sin correo'}</td>
        <td>${offer.room_number || 'Sin asignar'}</td>
        <td>${offer.details || 'Sin detalles'}</td>
        <td>$${price.toFixed(2)}</td>
        <td>${offer.discount}%</td>
        <td>${new Date(offer.validFrom).toLocaleDateString('es-ES')}</td>
        <td>${new Date(offer.validTo).toLocaleDateString('es-ES')}</td>
        <td>${offer.status}</td>
      `;
      modalOffersTableBody.appendChild(row);
    });

    const totalRecords = filteredOffers.length;
    paginationLabel.textContent = `Mostrando ${Math.min(recordsPerPage, totalRecords)} de ${totalRecords} registros`;

    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = end >= totalRecords;
  }

  recordsPerPageSelect.addEventListener('change', () => {
    recordsPerPage = parseInt(recordsPerPageSelect.value);
    currentPage = 1;
    renderOffers();
  });

  prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderOffers();
    }
  });

  nextPageButton.addEventListener('click', () => {
    if ((currentPage * recordsPerPage) < filteredOffers.length) {
      currentPage++;
      renderOffers();
    }
  });

  dateFromFilter.addEventListener('change', loadOffers);
  monthFilter.addEventListener('change', loadOffers);
  statusFilter.addEventListener('change', loadOffers);
});

function closeOffersModal() {
  document.getElementById('offersModal').style.display = 'none';
  clearFilters();
}