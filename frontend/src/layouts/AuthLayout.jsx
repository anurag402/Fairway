import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

const MotionDiv = motion.div;

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <MotionDiv
        initial={{ opacity: 0, x: -25 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative hidden overflow-hidden bg-slate-100 dark:bg-slate-950 lg:block"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(34,211,238,0.22),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(14,165,233,0.16),transparent_40%)] dark:bg-[radial-gradient(circle_at_20%_25%,rgba(34,211,238,0.35),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.32),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(14,165,233,0.2),transparent_40%)]" />
        <div className="relative flex h-full items-center p-14">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300/90">
              Fairway Impact
            </p>
            <h1 className="max-w-md text-5xl font-semibold leading-tight text-slate-900 dark:text-slate-100">
              A better subscription experience for play, purpose, and payouts.
            </h1>
            <p className="mt-5 max-w-md text-slate-600 dark:text-slate-300">
              Modern dashboard tools for golfers who want transparent draws and
              measurable charity impact.
            </p>
          </div>
        </div>
      </MotionDiv>

      <div className="flex items-center justify-center p-6 sm:p-8">
        <Outlet />
      </div>
    </div>
  );
}
