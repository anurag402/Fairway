import { api } from "./api";

export async function loginRequest(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function signupRequest(payload) {
  const { data } = await api.post("/auth/signup", payload);
  return data;
}
