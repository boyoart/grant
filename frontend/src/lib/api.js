import axios from "axios";

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("foodnova_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Functions
export const seedData = () => api.post("/seed");

// Categories
export const getCategories = () => api.get("/categories");
export const adminGetCategories = () => api.get("/admin/categories");
export const createCategory = (data) => api.post("/admin/categories", data);
export const updateCategory = (id, data) => api.put(`/admin/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`);

// Products
export const getProducts = (categoryId, search) => 
  api.get("/products", { params: { ...(categoryId && { category_id: categoryId }), ...(search && { search }) } });
export const searchProducts = (query) => api.get(`/products/search/${query}`);
export const getProduct = (id) => api.get(`/products/${id}`);
export const adminGetProducts = () => api.get("/admin/products");
export const createProduct = (data) => api.post("/admin/products", data);
export const updateProduct = (id, data) => api.put(`/admin/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/admin/products/${id}`);

// Stock
export const adjustStock = (data) => api.post("/admin/stock/adjust", data);
export const getStockLogs = (productId) => 
  api.get("/admin/stock/logs", { params: productId ? { product_id: productId } : {} });
export const getLowStockProducts = () => api.get("/admin/stock/low");

// Delivery Zones
export const getDeliveryZones = () => api.get("/delivery-zones");
export const adminGetDeliveryZones = () => api.get("/admin/delivery-zones");
export const createDeliveryZone = (data) => api.post("/admin/delivery-zones", data);
export const updateDeliveryZone = (id, data) => api.put(`/admin/delivery-zones/${id}`, data);
export const deleteDeliveryZone = (id) => api.delete(`/admin/delivery-zones/${id}`);

// Orders
export const createOrder = (data) => api.post("/orders", data);
export const getMyOrders = () => api.get("/orders/my");
export const getOrder = (orderNumber) => api.get(`/orders/${orderNumber}`);
export const adminGetOrders = (status) => 
  api.get("/admin/orders", { params: status ? { status } : {} });
export const updateOrderStatus = (id, data) => api.put(`/admin/orders/${id}/status`, data);

// Settings
export const getSettings = () => api.get("/settings");
export const adminGetSettings = () => api.get("/admin/settings");
export const updateSettings = (data) => api.put("/admin/settings", data);

// Dashboard
export const getDashboardStats = () => api.get("/admin/dashboard/stats");

export default api;
