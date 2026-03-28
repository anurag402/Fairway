import { motion } from "framer-motion";
import { Card } from "./Card";

const MotionDiv = motion.div;

export function AdminStatCard({
  title,
  value,
  icon,
  loading = false,
  index = 0,
}) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card className="h-full rounded-xl p-6 shadow-lg transition-transform duration-300 hover:scale-[1.02]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
            {title}
          </p>
          {icon ? (
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-slate-100 text-cyan-600 dark:bg-white/10 dark:text-cyan-200">
              {icon}
            </span>
          ) : null}
        </div>
        {loading ? (
          <div className="mt-3 h-8 w-24 animate-pulse rounded-md bg-slate-100 dark:bg-white/10" />
        ) : (
          <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {value}
          </p>
        )}
      </Card>
    </MotionDiv>
  );
}
