export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
      staggerChildren: 0.08,
    },
  },
  exit: { opacity: 0, y: -14, transition: { duration: 0.25 } },
};

export const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -6, scale: 1.01, transition: { duration: 0.2 } },
};

export const buttonTap = {
  whileTap: { scale: 0.98 },
  whileHover: { scale: 1.01 },
};
