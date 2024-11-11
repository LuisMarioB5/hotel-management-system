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
  },
};
