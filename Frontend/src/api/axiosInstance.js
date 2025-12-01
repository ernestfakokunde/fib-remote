import axios from "axios";
import { toast } from 'react-toastify';

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    'Content-Type': 'application/json'
  }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config; // Return the modified config
});

API.interceptors.response.use(
  (response) => {
    // If the request is successful, just return the response
    return response;
  },
  (error) => {
    // If there's an error, show a toast notification
    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred.';
    toast.error(message);
    
    // Reject the promise to allow individual catch blocks to handle the error
    return Promise.reject(error);
  }
);

export default API;