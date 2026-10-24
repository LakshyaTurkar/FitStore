import api from './client';

export const authApi = {
  google: (credential) => api.post('/auth/google', { credential }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const storeApi = {
  config: () => api.get('/config'),
  categories: () => api.get('/categories'),
};

export const productApi = {
  list: (params) => api.get('/products', { params }),
  get: (idOrSlug) => api.get(`/products/${encodeURIComponent(idOrSlug)}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
  reviews: (id, params) => api.get(`/products/${id}/reviews`, { params }),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
};

export const cartApi = {
  get: () => api.get('/cart'),
  add: (productId, quantity = 1) => api.post('/cart/items', { productId, quantity }),
  update: (productId, quantity) => api.patch(`/cart/items/${productId}`, { quantity }),
  remove: (productId) => api.delete(`/cart/items/${productId}`),
  clear: () => api.delete('/cart'),
};

export const orderApi = {
  checkout: (data) => api.post('/orders/checkout', data),
  mine: (params) => api.get('/orders/my', { params }),
  get: (id) => api.get(`/orders/${id}`),
  verifyPayment: (id, data) => api.post(`/orders/${id}/verify-payment`, data),
  reportFailure: (id, paymentId) => api.post(`/orders/${id}/payment-failed`, { razorpay_payment_id: paymentId }),
  retryPayment: (id) => api.post(`/orders/${id}/retry-payment`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
};

export const userApi = {
  addresses: () => api.get('/users/addresses'),
  addAddress: (data) => api.post('/users/addresses', data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  orders: (params) => api.get('/admin/orders', { params }),
  updateStatus: (id, status, note) => api.patch(`/admin/orders/${id}/status`, { status, note }),
};
