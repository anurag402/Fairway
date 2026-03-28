import { api } from "./api";

export async function fetchUserProfile() {
  const { data } = await api.get("/user/profile");
  return data;
}

export async function fetchUserScores() {
  const { data } = await api.get("/scores");
  return data;
}

export async function addUserScore(payload) {
  const { data } = await api.post("/scores", payload);
  return data;
}

export async function updateUserScore(scoreId, payload) {
  const { data } = await api.put(`/scores/${scoreId}`, payload);
  return data;
}

export async function deleteUserScore(scoreId) {
  const { data } = await api.delete(`/scores/${scoreId}`);
  return data;
}

export async function updateUserProfile(payload) {
  const { data } = await api.put("/user/profile", payload);
  return data;
}

export async function uploadWinnerProof(payload) {
  const { data } = await api.post("/user/winner-proof", payload);
  return data;
}
