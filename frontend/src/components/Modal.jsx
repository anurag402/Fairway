import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./Button";

const MotionDiv = motion.div;

export function Modal({ open, title, children, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/55"
            onClick={onClose}
          />
          <MotionDiv
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="fixed left-1/2 top-1/2 z-[60] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white/95 p-6 text-slate-900 shadow-2xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/90 dark:text-slate-100"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
              <Button variant="ghost" onClick={onClose} className="px-3 py-1.5">
                Close
              </Button>
            </div>
            {children}
          </MotionDiv>
        </>
      ) : null}
    </AnimatePresence>
  );
}
