import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/Button";

const MotionDiv = motion.div;

export function NotFoundPage() {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xl py-24 text-center"
    >
      <p className="text-sm uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
        404
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">
        Page not found
      </h1>
      <p className="mt-4 text-slate-600 dark:text-slate-300">
        The page you requested does not exist or was moved.
      </p>
      <Link to="/" className="mt-8 inline-block">
        <Button>Back to Home</Button>
      </Link>
    </MotionDiv>
  );
}
