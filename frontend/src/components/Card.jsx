import { motion } from "framer-motion";
import { cn } from "../utils/cn";

const MotionArticle = motion.article;

export function Card({ className, children, hover = false }) {
  return (
    <MotionArticle
      whileHover={hover ? { y: -5, scale: 1.01 } : undefined}
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/80 p-6 text-slate-900 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-colors dark:border-white/15 dark:bg-white/6 dark:text-slate-100 dark:shadow-[0_20px_60px_-28px_rgba(15,23,42,0.9)]",
        className,
      )}
    >
      {children}
    </MotionArticle>
  );
}
