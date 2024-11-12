const BASE_URL = 'http://localhost:3000';

export const BACKEND_ROUTES = {
  auth: {
    login: `${BASE_URL}/auth/login`,
  },
  customers: {
    create: `${BASE_URL}/customers/register`,
    update: (id) => `${BASE_URL}/customers/${id}`,
    delete: (id) => `${BASE_URL}/customers/${id}`,
    getAll: `${BASE_URL}/customers`,
    getById: (id) => `${BASE_URL}/customers/${id}`,
    getByDocumentNumber: (documentNumber) => `${BASE_URL}/customers/document/${documentNumber}`,
    getEnumsValues: `${BASE_URL}/customers/enums/values`,
  },
  users: {
    create: `${BASE_URL}/users/register`,
    update: (id) => `${BASE_URL}/users/${id}`,
    delete: (id) => `${BASE_URL}/users/${id}`,
    getAll: `${BASE_URL}/users`,
    getById: (id) => `${BASE_URL}/users/${id}`,
    getByUsername: (username) => `${BASE_URL}/users/username/${username}`,
    getEnumsValues: `${BASE_URL}/users/enums/values`,
  },
  rooms: {
    create: `${BASE_URL}/rooms/register`,
    update: (id) => `${BASE_URL}/rooms/${id}`,
    changeStatusToAvailable: (id) => `${BASE_URL}/rooms/${id}/available`,
    delete: (id) => `${BASE_URL}/rooms/${id}`,
    getAll: `${BASE_URL}/rooms`,
    getById: (id) => `${BASE_URL}/rooms/${id}`,
    getByRoomNumber: (roomNumber) => `${BASE_URL}/rooms/roomNumber/${roomNumber}`,
    getRoomsAvailable: `${BASE_URL}/bookings/rooms/available`,
    getEnumsValues: `${BASE_URL}/rooms/enums/values`,
  },
  bookings: {
    create: `${BASE_URL}/bookings/register`,
    update: (id) => `${BASE_URL}/bookings/${id}`,
    delete: (id) => `${BASE_URL}/bookings/${id}`,
    getAll: `${BASE_URL}/bookings`,
    getById: (id) => `${BASE_URL}/bookings/${id}`,
    getEnumsValues: `${BASE_URL}/bookings/enums/values`,
    confirm: (id) => `${BASE_URL}/bookings/${id}/confirm`,
    cancel: (id) => `${BASE_URL}/bookings/${id}/cancel`,
    checkIn: (id) => `${BASE_URL}/bookings/${id}/check-in`,
    checkOut: (id) => `${BASE_URL}/bookings/${id}/check-out`,
    desactive: (id) => `${BASE_URL}/bookings/${id}/desactive`
  },
};
