import { BACKEND_ROUTES } from '../config/backend.routes.js';
import { validateParamIsNotNull } from '../scripts/utils.js';

// Asegúrate de que jsPDF y autoTable están disponibles globalmente
const { jsPDF } = window.jspdf;

// Función global
window.downloadProductsReportPDF = async function(status, category) {
    validateParamIsNotNull('status', status);
    validateParamIsNotNull('category', category);

    try {
        const response = await fetch(BACKEND_ROUTES.products.getAll, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (response.ok) {
            const products = await response.json();

            const filteredProducts = products.filter(product => {
                const matchStatus = status === 'all' || (status === 'activo' && product.isActive) || (status === 'inactivo' && !product.isActive);
                const matchCategory = category === 'all' || product.category === category;
                return matchStatus && matchCategory;
            });

            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text("Reporte de Productos/Servicios", 14, 22);
            doc.setFontSize(12);
            doc.text(`Estado: ${status.charAt(0).toUpperCase() + status.slice(1)}, Categoría: ${category.charAt(0).toUpperCase() + category.slice(1)}`, 14, 30);

            doc.autoTable({
                startY: 40,
                head: [['ID', 'Nombre', 'Precio', 'Cantidad', 'Categoría', 'Estado']],
                body: filteredProducts.map(product => [
                    product.id,
                    product.name,
                    product.unitPrice,
                    product.quantity,
                    product.category,
                    product.isActive ? 'Activo' : 'Inactivo'
                ]),
                styles: { fontSize: 10 },
                headStyles: { fillColor: [22, 160, 133] },
                alternateRowStyles: { fillColor: [240, 240, 240] }
            });

            doc.save('products_report.pdf');
        }
    } catch (error) {
        console.error('Error al generar el reporte', error);
    }
}



// Integrar la función de descarga en tu HTML
document.querySelector('.downloadproduct-btn').addEventListener('click', async () => {
    const status = document.getElementById('status').value;
    const category = document.getElementById('category').value;
    await downloadProductsReportPDF(status, category);
});

