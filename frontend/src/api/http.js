import axios from 'axios';

export const BASE_URL = 'https://spare-parts-o59j.onrender.com';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API methods
export const api = {
  get: async (endpoint) => {
    const response = await axiosInstance.get(endpoint);
    return response.data;
  },
  
  post: async (endpoint, data) => {
    const response = await axiosInstance.post(endpoint, data);
    return response.data;
  },
  
  put: async (endpoint, data) => {
    const response = await axiosInstance.put(endpoint, data);
    return response.data;
  },
  
  delete: async (endpoint) => {
    const response = await axiosInstance.delete(endpoint);
    return response.data;
  },
};

export default api;
