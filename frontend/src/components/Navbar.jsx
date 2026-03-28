import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiLogIn,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiSun,
  FiX,
  FiZap,
} from "react-icons/fi";
import { Button } from "./Button";
import { APP_NAME, navLinks } from "../utils/constants";
import { useAuth } from "../hooks/useAuth";
import { useThemeStore } from "../store/themeStore";

const MotionNav = motion.nav;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const handleSignout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm transition ${
      isActive
        ? "bg-slate-200 text-slate-900 dark:bg-white/20 dark:text-white"
        : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
    }`;

  return (
    <MotionNav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 border-b border-slate-200 bg-white/75 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-slate-900/70"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <NavLink
          to="/"
          className="text-lg font-semibold text-slate-900 dark:text-white"
        >
          {APP_NAME}
        </NavLink>

        <button
          className="rounded-lg border border-slate-300 p-2 text-slate-700 transition-colors dark:border-white/20 dark:text-slate-200 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {open ? <FiX className="size-5" /> : <FiMenu className="size-5" />}
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200 dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <>
                <FiSun className="size-4" aria-hidden="true" />
                Light
              </>
            ) : (
              <>
                <FiMoon className="size-4" aria-hidden="true" />
                Dark
              </>
            )}
          </button>

          {navLinks.map((link) => (
            <NavLink key={link.href} to={link.href} className={linkClass}>
              {link.label}
            </NavLink>
          ))}

          {isAuthenticated ? (
            <Button variant="secondary" onClick={handleSignout}>
              <FiLogOut className="size-4" aria-hidden="true" />
              Logout
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")}>
                <FiLogIn className="size-4" aria-hidden="true" />
                Log in
              </Button>
              <Button onClick={() => navigate("/signup")}>
                <FiZap className="size-4" aria-hidden="true" />
                Subscribe Now
              </Button>
            </>
          )}
        </div>
      </div>

      {open ? (
        <div className="space-y-2 border-t border-slate-200 px-4 py-4 dark:border-white/10 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200 dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
          >
            {theme === "dark" ? (
              <>
                <FiSun className="size-4" aria-hidden="true" />
                Switch to Light
              </>
            ) : (
              <>
                <FiMoon className="size-4" aria-hidden="true" />
                Switch to Dark
              </>
            )}
          </button>

          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-2">
            {isAuthenticated ? (
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleSignout}
              >
                <FiLogOut className="size-4" aria-hidden="true" />
                Logout
              </Button>
            ) : (
              <Button className="w-full" onClick={() => navigate("/signup")}>
                <FiZap className="size-4" aria-hidden="true" />
                Subscribe Now
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </MotionNav>
  );
}
