import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  // baseURL: "https://53gflbb8-8000.inc1.devtunnels.ms/api",
});

export default api;
