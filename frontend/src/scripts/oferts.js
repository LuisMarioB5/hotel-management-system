document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('topservicios');
    const sendOffersButton = document.getElementById('enviarreportes');
    const offersTableBody = document.querySelector('.user-table tbody');
    let generatedOffers = []; // Almacenar las ofertas generadas
  
    // Inyectar estilos CSS para el botón de acción y la columna "Estado"
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
        color: #dc3545; /* Rojo para eliminar */
      }
      .action-btn:hover {
        transform: scale(1.2);
      }
      /* Estilos para la columna Estado */
      .user-table td.status {
        font-weight: 500;
        padding: 8px;
        text-align: center;
      }
      .user-table td.status.Aceptada {
        background-color: #28a745; /* Fondo verde para Aceptada */
        color: #ffffff; /* Texto blanco para contraste */
        border-radius: 4px;
      }
    `;
    document.head.appendChild(style);
  
    generateButton.addEventListener('click', async () => {
      // Obtener los valores de los selectores
      const numCustomers = document.getElementById('topProSer').value;
      const frequency = document.getElementById('topcategory').value;
  
      // Mapear los valores de frecuencia a 0 o 1
      const isFrequentGuest = frequency === 'HABITUAL' ? 1 : 0;
  
      try {
        // Mostrar SweetAlert con animación de carga
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
  
        // Hacer la solicitud al backend (NestJS)
        const response = await fetch(`http://localhost:3000/offers/generate?numCustomers=${numCustomers}&isFrequentGuest=${isFrequentGuest}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al generar las ofertas');
        }
  
        const offers = await response.json();
  
        // Imprimir los datos recibidos en la consola para depurar
        console.log('Datos recibidos del backend:', offers);
  
        // Verificar si offers es un array y tiene datos
        if (!Array.isArray(offers) || offers.length === 0) {
          throw new Error('No se recibieron ofertas válidas');
        }
  
        // Esperar 1.5 segundos para simular el tiempo de carga
        await new Promise(resolve => setTimeout(resolve, 1500));
  
        // Cerrar el SweetAlert de carga
        Swal.close();
  
        // Mostrar SweetAlert de éxito
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
  
        // Limpiar la tabla antes de agregar nuevos datos
        offersTableBody.innerHTML = '';
  
        // Generar la fecha actual y la fecha de validez (1 día después)
        const currentDate = new Date();
        const offerDate = currentDate.toLocaleDateString('es-ES');
        const validFrom = currentDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        const validToDate = new Date(currentDate);
        validToDate.setDate(currentDate.getDate() + 1);
        const validTo = validToDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  
        // Preparar las ofertas para guardarlas y enviarlas
        generatedOffers = offers.map(offer => {
          // Calcular un descuento aleatorio entre 10% y 20%
          const discountPercentage = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
          const originalPrice = offer.price || 0;
          const discountAmount = (originalPrice * discountPercentage) / 100;
          const offerPrice = originalPrice - discountAmount;
  
          return {
            customer_id: offer.customer_id,
            room_id: offer.room_id,
            discount: discountPercentage,
            validFrom: validFrom,
            validTo: validTo,
            status: 'ACEPTADA',
            details: offer.details,
            price: offerPrice,
            email: offer.email,
            room_number: offer.room_number,
          };
        });
  
        // Insertar los datos en la tabla HTML
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
            <td class="status Aceptada">Aceptada</td>
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
        // Cerrar el SweetAlert de carga en caso de error
        Swal.close();
  
        // Mostrar un mensaje de error si algo falla
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
  
    // Evento para el botón "Enviar ofertas"
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
  
    console.log('Ofertas enviadas al backend:', generatedOffers); // Depuración
  
    try {
      // Mostrar SweetAlert con animación de carga
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
  
      // Enviar las ofertas al backend para guardarlas y enviar correos
      const response = await fetch('http://localhost:3000/offers/save-and-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generatedOffers),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar las ofertas');
      }
  
      // Cerrar el SweetAlert de carga
      Swal.close();
  
      // Mostrar SweetAlert de éxito
      Swal.fire({
        title: 'Ofertas Enviadas',
        text: 'Las ofertas han sido guardadas y enviadas a los clientes.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        heightAuto: false,
        customClass: {
          container: 'swal-container',
        },
      });
  
      // Limpiar las ofertas generadas después de enviarlas
      generatedOffers = [];
      offersTableBody.innerHTML = '';
      const paginationLabel = document.querySelector('.pagination-info label');
      paginationLabel.textContent = `Mostrando 0 de 0 registros`;
  
    } catch (error) {
      // Cerrar el SweetAlert de carga en caso de error
      Swal.close();
  
      // Mostrar un mensaje de error si algo falla
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
  
    // Evento para el botón de "Eliminar"
    offersTableBody.addEventListener('click', (event) => {
      const row = event.target.closest('tr');
      if (!row) return;
  
      if (event.target.closest('.remove-offer')) {
        // Mostrar SweetAlert de confirmación antes de eliminar
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
            // Eliminar la fila de la tabla
            const index = Array.from(offersTableBody.children).indexOf(row);
            generatedOffers.splice(index, 1); // Eliminar la oferta del array
            row.remove();
  
            // Mostrar SweetAlert de éxito
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
  
            // Actualizar la información de paginación
            const remainingRows = offersTableBody.querySelectorAll('tr').length;
            const paginationLabel = document.querySelector('.pagination-info label');
            paginationLabel.textContent = `Mostrando ${remainingRows} de ${remainingRows} registros`;
          }
        });
      }
    });
  });