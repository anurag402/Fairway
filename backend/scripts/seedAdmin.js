import dotenv from "dotenv";
import bcrypt from "bcrypt";

import { connectDB } from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

async function seedAdmin() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set in .env",
    );
  }

  if (password.length < 6) {
    throw new Error("ADMIN_PASSWORD must be at least 6 characters.");
  }

  await connectDB();

  const existingUser = await User.findOne({ email });
  const hashedPassword = await bcrypt.hash(password, 10);

  if (existingUser) {
    existingUser.role = "admin";
    existingUser.password = hashedPassword;
    await existingUser.save();

    // eslint-disable-next-line no-console
    console.log(
      `Existing user promoted to admin and password updated: ${email}`,
    );
    return;
  }

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
    subscription: {
      status: "active",
      plan: "monthly",
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Admin user created: ${email}`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Admin seed failed:", error.message);
    process.exit(1);
  });
