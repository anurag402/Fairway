export function Loader({ label = "Loading" }) {
  return (
    <div className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
      <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-500 dark:border-white/20 dark:border-t-cyan-400" />
      <span>{label}...</span>
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-100 dark:bg-white/10 ${className}`}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </div>
  );
}
