import { api } from "./api";

export async function fetchAdminUsers(params = {}) {
  const { data } = await api.get("/admin/users", { params });
  return data;
}

export async function fetchAdminAnalytics() {
  const { data } = await api.get("/admin/analytics");
  return data;
}

export async function fetchAdminDonations(params = {}) {
  const { data } = await api.get("/admin/donations", { params });
  return data;
}

export async function runMonthlyDrawRequest(payload = {}) {
  const { data } = await api.post("/draw/run", payload);
  return data;
}

export async function simulateMonthlyDrawRequest(payload = {}) {
  const { data } = await api.post("/draw/simulate", payload);
  return data;
}

export async function fetchLatestDrawRequest() {
  const { data } = await api.get("/draw/latest");
  return data;
}

export async function publishDrawRequest(drawId) {
  const { data } = await api.post(`/draw/publish/${drawId}`);
  return data;
}

export async function updateWinnerStatus(payload) {
  const { data } = await api.put("/admin/verify-winner", payload);
  return data;
}

export async function createCharity(payload) {
  const { data } = await api.post("/charities", payload);
  return data;
}

export async function fetchAdminCharities() {
  const { data } = await api.get("/admin/charities");
  return data;
}

export async function updateCharityListing(charityId, payload) {
  const { data } = await api.put(`/charities/${charityId}`, payload);
  return data;
}

export async function deleteCharityListing(charityId) {
  const { data } = await api.delete(`/charities/${charityId}`);
  return data;
}

export async function updateUserSubscriptionRequest(payload) {
  const { data } = await api.put("/admin/subscription", payload);
  return data;
}
