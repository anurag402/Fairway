import { create } from "zustand";

const THEME_STORAGE_KEY = "fairway-theme";

function resolveInitialTheme() {
  if (typeof window === "undefined") return "dark";

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeClass(theme) {
  if (typeof document === "undefined") return;

  const html = document.documentElement;
  html.classList.toggle("dark", theme === "dark");
}

export const useThemeStore = create((set, get) => ({
  theme: resolveInitialTheme(),
  initializeTheme: () => {
    const theme = get().theme;
    applyThemeClass(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  },
  setTheme: (theme) => {
    const nextTheme = theme === "dark" ? "dark" : "light";
    applyThemeClass(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    set({ theme: nextTheme });
  },
  toggleTheme: () => {
    const nextTheme = get().theme === "dark" ? "light" : "dark";
    applyThemeClass(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    set({ theme: nextTheme });
  },
}));
