const BASE_URL = 'http://localhost:3000';
const auth = 'auth';
const customers = 'customers';
const users = 'users';
const rooms = 'rooms';
const bookings = 'bookings';
const products = 'products';
const consumptions = 'consumptions';
const billing = 'billing/invoices';
const reports = 'reports';
const housekeeping = 'housekeeping/tasks';

export const BACKEND_ROUTES = {
  auth: {
    login: `${BASE_URL}/${auth}/login`,
  },
  customers: {
    create: `${BASE_URL}/${customers}/register`,
    update: (id) => `${BASE_URL}/${customers}/${id}`,
    delete: (id) => `${BASE_URL}/${customers}/${id}`,
    getAll: `${BASE_URL}/${customers}`,
    getById: (id) => `${BASE_URL}/${customers}/${id}`,
    getByDocumentNumber: (documentNumber) => `${BASE_URL}/${customers}/document/${documentNumber}`,
    getEnumsValues: `${BASE_URL}/${customers}/enums/values`,
  },
  users: {
    create: `${BASE_URL}/${users}/register`,
    update: (id) => `${BASE_URL}/${users}/${id}`,
    delete: (id) => `${BASE_URL}/${users}/${id}`,
    getAll: `${BASE_URL}/${users}`,
    getById: (id) => `${BASE_URL}/${users}/${id}`,
    getByUsername: (username) => `${BASE_URL}/${users}/username/${username}`,
    getEnumsValues: `${BASE_URL}/${users}/enums/values`,
  },
  rooms: {
    create: `${BASE_URL}/${rooms}/register`,
    update: (id) => `${BASE_URL}/${rooms}/${id}`,
    changeStatusToAvailable: (id) => `${BASE_URL}/${rooms}/${id}/available`,
    delete: (id) => `${BASE_URL}/${rooms}/${id}`,
    getAll: `${BASE_URL}/${rooms}`,
    getById: (id) => `${BASE_URL}/${rooms}/${id}`,
    getByRoomNumber: (roomNumber) => `${BASE_URL}/${rooms}/roomNumber/${roomNumber}`,
    getRoomsAvailable: `${BASE_URL}/${bookings}/${rooms}/available`,
    getEnumsValues: `${BASE_URL}/${rooms}/enums/values`,
  },
  bookings: {
    create: `${BASE_URL}/${bookings}/register`,
    update: (id) => `${BASE_URL}/${bookings}/${id}`,
    delete: (id) => `${BASE_URL}/${bookings}/${id}`,
    getAll: `${BASE_URL}/${bookings}`,
    getById: (id) => `${BASE_URL}/${bookings}/${id}`,
    getEnumsValues: `${BASE_URL}/${bookings}/enums/values`,
    confirm: (id) => `${BASE_URL}/${bookings}/${id}/confirm`,
    cancel: (id) => `${BASE_URL}/${bookings}/${id}/cancel`,
    checkIn: (id) => `${BASE_URL}/${bookings}/${id}/check-in`,
    checkOut: (id) => `${BASE_URL}/${bookings}/${id}/check-out`,
    desactive: (id) => `${BASE_URL}/${bookings}/${id}/desactive`,
  },
  products: {
    create: `${BASE_URL}/${products}`,
    getAll: `${BASE_URL}/${products}`,
    getById: (id) => `${BASE_URL}/${products}/${id}`,
    getByName: (name) => `${BASE_URL}/${products}/name/${name}`,
    update: (id) => `${BASE_URL}/${products}/${id}`,
    delete: (id) => `${BASE_URL}/${products}/${id}`,
    getEnumsValues: `${BASE_URL}/${products}/enums/values`,
  },
  consumptions: {
    add: `${BASE_URL}/${consumptions}/add`,
    getAll: `${BASE_URL}/${consumptions}`,
    getById: (id) => `${BASE_URL}/${consumptions}/${id}`,
    getByBookingId: (bookingId) => `${BASE_URL}/${consumptions}/booking/${bookingId}`,
    update: (id) => `${BASE_URL}/${consumptions}/${id}`,
    delete: (id) => `${BASE_URL}/${consumptions}/${id}`,
  },
  billing: {
    create: `${BASE_URL}/${billing}`,
    getAll: `${BASE_URL}/${billing}`,
    getById: (id) => `${BASE_URL}/${billing}/${id}`,
    generatePDF: (id) => `${BASE_URL}/${billing}/${id}/pdf`,
    getEnumsValues: `${BASE_URL}/${billing}/enums/values`,
    updatePaymentStatus: (id) => `${BASE_URL}/${billing}/${id}/payment-status`,
    disable: (id) => `${BASE_URL}/${billing}/${id}`,
  },
  reports: {
    generateConsumptions: (id) => `${BASE_URL}/${reports}/consumptions/${id}/pdf`,
    generateProductsOffered:(isActive, category) => `${BASE_URL}/${reports}/productsOffered/pdf?isActive=${isActive}&category=${category}`,
    generateBookingsByRoom:(roomId, checkInDate, checkOutDate) => `${BASE_URL}/${reports}/bookingsByRoom/${roomId}/pdf?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`,
    generateTopConsumptions:(limit, category) => `${BASE_URL}/${reports}/topConsumptions/pdf?limit=${limit}&category=${category}`,
  },
  housekeeping: {
    create: `${BASE_URL}/${housekeeping}`,
    getAll: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return `${BASE_URL}/${housekeeping}${params ? `?${params}` : ''}`;
    },
    getById: (id) => `${BASE_URL}/${housekeeping}/${id}`,
    getEnumsValues: `${BASE_URL}/${housekeeping}/enums/values`,
    assign: (id) => `${BASE_URL}/${housekeeping}/${id}/assign`,
    start: (id) => `${BASE_URL}/${housekeeping}/${id}/start`,
    complete: (id) => `${BASE_URL}/${housekeeping}/${id}/complete`,
    cancel: (id) => `${BASE_URL}/${housekeeping}/${id}/cancel`,
  },
};
