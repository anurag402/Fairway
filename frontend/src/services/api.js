import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { AUTH_TOKEN_KEY } from "../utils/authKeys";

const baseURL = "https://fairway-2.onrender.com/api";

export const api = axios.create({
  baseURL,
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token =
    useAuthStore.getState().token || localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.message || "");
    const isAuthFailure =
      status === 401 &&
      /(Unauthorized|Invalid or expired token|User not found)/i.test(message);

    if (isAuthFailure) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);
