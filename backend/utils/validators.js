import AppError from "./appError.js";

export function requireFields(payload, fields) {
  for (const field of fields) {
    const value = payload[field];

    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      throw new AppError(`${field} is required`, 400);
    }
  }
}

export function normalizeEmail(email) {
  return String(email).toLowerCase().trim();
}

export function normalizeName(name) {
  return String(name).trim().replace(/\s+/g, " ");
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateScoreValue(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 45;
}

export function validateDateInput(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export function validateCharityPercentage(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 10 && number <= 100;
}
