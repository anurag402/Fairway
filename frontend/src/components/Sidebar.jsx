import { NavLink } from "react-router-dom";
import { FiBarChart2, FiHeart, FiShield, FiTarget } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";

const dashboardLinks = [
  { label: "Overview", to: "/dashboard", icon: FiBarChart2 },
  { label: "Scores", to: "/scores", icon: FiTarget },
  { label: "Charities", to: "/charities", icon: FiHeart },
];

export function Sidebar() {
  const { user } = useAuth();

  const links =
    user?.role === "admin"
      ? [...dashboardLinks, { label: "Admin", to: "/admin", icon: FiShield }]
      : dashboardLinks;

  return (
    <aside className="sticky top-24 hidden h-fit w-64 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-xl backdrop-blur-xl transition-colors dark:border-white/15 dark:bg-white/5 lg:block">
      <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        Workspace
      </p>
      <nav className="space-y-1">
        {links.map((link) => (
          // Keep icon component capitalized for JSX + lint compatibility.
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm transition ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-slate-900 dark:from-cyan-500/30 dark:to-blue-500/30 dark:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              }`
            }
          >
            <span className="inline-flex items-center gap-2">
              <link.icon className="size-4" />
              {link.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
