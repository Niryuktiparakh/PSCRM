import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const password = localStorage.getItem("password");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (username && password) {
    config.headers.username = username;
    config.headers.password = password;
  }

  return config;
});

export default client;
