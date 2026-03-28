import { api } from "./api";

export async function fetchCharities() {
  const { data } = await api.get("/charities");
  return data;
}

export async function fetchCharityById(charityId) {
  const { data } = await api.get(`/charities/${charityId}`);
  return data;
}

export async function fetchCharitiesWithFilters(params = {}) {
  const { data } = await api.get("/charities", { params });
  return data;
}

export async function selectCharityRequest(payload) {
  const { data } = await api.post("/charity/select", payload);
  return data;
}

export async function donateToCharityRequest(charityId, payload) {
  const { data } = await api.post(`/charities/${charityId}/donate`, payload);
  return data;
}

export async function fetchMyDonationHistory(params = {}) {
  const { data } = await api.get("/charities/donations/me", { params });
  return data;
}
