import { api } from "./api";

export async function createSubscriptionSession(plan) {
  const { data } = await api.post("/payment/create-checkout-session", { plan });
  return data?.data || data;
}
