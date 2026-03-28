import { validateScore } from "./validators";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getAuthFieldRules() {
  return {
    name: {
      required: "Name must be at least 2 characters.",
      minLength: {
        value: 2,
        message: "Name must be at least 2 characters.",
      },
    },
    email: {
      required: "Please enter a valid email address.",
      pattern: {
        value: EMAIL_REGEX,
        message: "Please enter a valid email address.",
      },
    },
    password: {
      required: "Password must be at least 6 characters.",
      minLength: {
        value: 6,
        message: "Password must be at least 6 characters.",
      },
    },
  };
}

export function getScoreFieldRules() {
  return {
    value: {
      required: "Score is required.",
      validate: (value) => validateScore(value) || true,
    },
    date: {
      required: "Date is required.",
    },
  };
}
