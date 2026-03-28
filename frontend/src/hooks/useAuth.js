import { useMemo } from "react";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);

  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  return { user, token, login, logout, setUser, isAuthenticated };
}
