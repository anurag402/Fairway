import { motion } from "framer-motion";
import { cn } from "../utils/cn";

const MotionButton = motion.button;

const variants = {
  primary:
    "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-blue-500/20 hover:from-cyan-400 hover:to-blue-400",
  secondary:
    "border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-white/20 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-white/10",
  success:
    "bg-emerald-500/85 text-emerald-50 border border-emerald-300/40 hover:bg-emerald-400/90",
  warning:
    "bg-amber-500/85 text-amber-50 border border-amber-300/40 hover:bg-amber-400/90",
  danger: "bg-rose-500/90 text-white hover:bg-rose-500",
};

export function Button({
  children,
  variant = "primary",
  className,
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <MotionButton
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-70",
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="size-4 animate-spin rounded-full border-2 border-slate-400/40 border-t-slate-800 dark:border-white/40 dark:border-t-white" />
          Processing...
        </span>
      ) : (
        children
      )}
    </MotionButton>
  );
}
