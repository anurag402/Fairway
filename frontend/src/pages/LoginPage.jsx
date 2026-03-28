import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { Card } from "../components/Card";
import { InputField } from "../components/InputField";
import { Button } from "../components/Button";
import { loginRequest } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { getAuthFieldRules } from "../utils/formRules";
import { getApiErrorMessage } from "../utils/apiError";

const MotionDiv = motion.div;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const authRules = getAuthFieldRules();

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (formData) => {
    setLoading(true);
    setApiError("");

    try {
      const data = await loginRequest(formData);
      login(data);
      toast.success("Welcome back.");
      const redirect = location.state?.from || "/dashboard";
      navigate(redirect, { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to login. Please retry.",
      );
      setApiError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <Card>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Log in
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Access your dashboard and manage your entries.
        </p>

        {apiError ? (
          <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {apiError}
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <InputField
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            placeholder="name@example.com"
            {...register("email", authRules.email)}
          />
          <InputField
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            placeholder="••••••••"
            {...register("password", authRules.password)}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Log in
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          New here?{" "}
          <Link
            className="font-medium text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
            to="/signup"
          >
            Create account
          </Link>
        </p>
      </Card>
    </MotionDiv>
  );
}
