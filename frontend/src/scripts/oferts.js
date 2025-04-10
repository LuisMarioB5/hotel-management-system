document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('topservicios');
    const offersTableBody = document.querySelector('.user-table tbody');
  
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
        const validToDate = new Date(currentDate);
        validToDate.setDate(currentDate.getDate() + 1);
        const validTo = validToDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  
        // Insertar los datos en la tabla HTML
        offers.forEach(offer => {
          // Calcular un descuento aleatorio entre 10% y 20%
          const discountPercentage = Math.floor(Math.random() * (20 - 10 + 1)) + 10; // Número aleatorio entre 10 y 20
          const originalPrice = offer.price || 0;
          const discountAmount = (originalPrice * discountPercentage) / 100;
          const offerPrice = originalPrice - discountAmount;
  
          const row = document.createElement('tr');
          row.innerHTML = `
            <td style="display: none;" class="customer-id">${offer.customer_id || ''}</td>
            <td>${offer.name || 'Desconocido'}</td>
            <td>${offer.email || 'Sin correo'}</td>
            <td style="display: none;" class="room-id">${offer.room_id || ''}</td>
            <td>${offer.room_number || 'Sin asignar'}</td>
            <td>${offer.details || 'Sin detalles'}</td>
            <td style="display: none;" class="original-price">${originalPrice}</td>
            <td>$${offerPrice.toFixed(2)} (${discountPercentage}% OFF)</td>
            <td>${offerDate}</td>
            <td style="display: none;" class="valid-to">${validTo}</td>
            <td class="status Pendiente"  style="display: none;">Pendiente</td>
            <td>
              <button class="action-btn remove-offer"><i class="fas fa-times"></i></button>
            </td>
          `;
          offersTableBody.appendChild(row);
        });
  
        // Actualizar la información de paginación
        const paginationLabel = document.querySelector('.pagination-info label');
        paginationLabel.textContent = `Mostrando ${offers.length} de ${offers.length} registros`;
  
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
  
    // Agregar evento para el botón de "Eliminar"
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