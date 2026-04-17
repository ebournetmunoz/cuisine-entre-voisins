import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const api = {
  setToken: (token: string | null) => {
    authToken = token;
  },

  // Auth
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string, phone?: string) => {
    const response = await apiClient.post('/auth/register', { name, email, password, phone });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },

  // Meals
  getMeals: async (params?: { category?: string; lat?: number; lng?: number; max_distance?: number }) => {
    const response = await apiClient.get('/meals', { params });
    return response.data;
  },

  getMeal: async (id: string) => {
    const response = await apiClient.get(`/meals/${id}`);
    return response.data;
  },

  getMyMeals: async () => {
    const response = await apiClient.get('/my-meals');
    return response.data;
  },

  createMeal: async (data: any) => {
    const response = await apiClient.post('/meals', data);
    return response.data;
  },

  deleteMeal: async (id: string) => {
    const response = await apiClient.delete(`/meals/${id}`);
    return response.data;
  },

  // Orders
  createOrder: async (data: { meal_id: string; portions: number; message?: string }) => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  getOrders: async () => {
    const response = await apiClient.get('/orders');
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await apiClient.put(`/orders/${orderId}/status?status=${status}`);
    return response.data;
  },

  deleteOrder: async (orderId: string) => {
    const response = await apiClient.delete(`/orders/${orderId}`);
    return response.data;
  },

  // Payments
  createCheckoutSession: async (orderId: string, originUrl: string) => {
    const response = await apiClient.post('/payments/create-checkout', { 
      order_id: orderId, 
      origin_url: originUrl 
    });
    return response.data;
  },

  getPaymentStatus: async (sessionId: string) => {
    const response = await apiClient.get(`/payments/status/${sessionId}`);
    return response.data;
  },

  getCookEarnings: async () => {
    const response = await apiClient.get('/payments/cook-earnings');
    return response.data;
  },

  // Messages
  sendMessage: async (receiverId: string, content: string) => {
    const response = await apiClient.post('/messages', { receiver_id: receiverId, content });
    return response.data;
  },

  getMessages: async (otherUserId: string) => {
    const response = await apiClient.get(`/messages/${otherUserId}`);
    return response.data;
  },

  getConversations: async () => {
    const response = await apiClient.get('/conversations');
    return response.data;
  },

  deleteConversation: async (otherUserId: string) => {
    const response = await apiClient.delete(`/conversations/${otherUserId}`);
    return response.data;
  },

  // Reviews
  createReview: async (data: {
    order_id: string;
    rating: number;
    comment?: string;
    quality_rating?: number;
    quantity_rating?: number;
    collection_rating?: number;
  }) => {
    const response = await apiClient.post('/reviews', data);
    return response.data;
  },

  getCookReviews: async (cookId: string) => {
    const response = await apiClient.get(`/reviews/cook/${cookId}`);
    return response.data;
  },

  getPendingReviews: async () => {
    const response = await apiClient.get('/reviews/my-pending');
    return response.data;
  },

  // Buyer Reviews (by cooks)
  createBuyerReview: async (data: {
    order_id: string;
    rating: number;
    comment?: string;
    punctuality_rating?: number;
    communication_rating?: number;
  }) => {
    const response = await apiClient.post('/reviews/buyer', data);
    return response.data;
  },

  getBuyerReviews: async (buyerId: string) => {
    const response = await apiClient.get(`/reviews/buyer/${buyerId}`);
    return response.data;
  },

  getCookPendingReviews: async () => {
    const response = await apiClient.get('/reviews/cook-pending');
    return response.data;
  },

  getPublicUserProfile: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/public-profile`);
    return response.data;
  },

  // Push Notifications
  savePushToken: async (token: string) => {
    const response = await apiClient.post('/push-token', { token });
    return response.data;
  },
};
