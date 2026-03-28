import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { Card } from "../components/Card";
import { InputField } from "../components/InputField";
import { Button } from "../components/Button";
import { signupRequest } from "../services/authService";
import { fetchCharities } from "../services/charityService";
import { useAuth } from "../hooks/useAuth";
import { getAuthFieldRules } from "../utils/formRules";
import { getApiErrorMessage } from "../utils/apiError";

const MotionDiv = motion.div;

export function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const authRules = getAuthFieldRules();

  const [loading, setLoading] = useState(false);
  const [charitiesLoading, setCharitiesLoading] = useState(true);
  const [charities, setCharities] = useState([]);
  const [apiError, setApiError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      charityId: "",
      charityPercentage: 10,
    },
  });

  useEffect(() => {
    async function loadCharities() {
      setCharitiesLoading(true);
      try {
        const data = await fetchCharities();
        const list = data.charities || [];
        setCharities(list);
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, "Unable to load charities for signup."),
        );
      } finally {
        setCharitiesLoading(false);
      }
    }

    loadCharities();
  }, []);

  const onSubmit = async (formData) => {
    setLoading(true);
    setApiError("");

    try {
      const data = await signupRequest(formData);
      login(data);
      toast.success("Subscription profile created.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "Signup failed. Please retry.");
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
          Start your membership
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Join in under 60 seconds, then personalize scores and charity
          settings.
        </p>

        {apiError ? (
          <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {apiError}
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <InputField
            label="Full Name"
            type="text"
            error={errors.name?.message}
            placeholder="Alex Taylor"
            {...register("name", authRules.name)}
          />
          <InputField
            label="Email"
            type="email"
            error={errors.email?.message}
            placeholder="name@example.com"
            {...register("email", authRules.email)}
          />
          <InputField
            label="Password"
            type="password"
            error={errors.password?.message}
            placeholder="At least 6 characters"
            {...register("password", authRules.password)}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Select Charity
            </label>
            <select
              {...register("charityId", {
                required: "Please select a charity.",
              })}
              disabled={charitiesLoading || loading}
              className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="">
                {charitiesLoading ? "Loading charities..." : "Choose a charity"}
              </option>
              {charities.map((charity) => (
                <option key={charity._id} value={charity._id}>
                  {charity.name}
                </option>
              ))}
            </select>
            {errors.charityId?.message ? (
              <p className="mt-1 text-sm text-rose-400">
                {errors.charityId.message}
              </p>
            ) : null}
          </div>

          <InputField
            label="Charity Contribution (%)"
            type="number"
            min={10}
            max={100}
            error={errors.charityPercentage?.message}
            {...register("charityPercentage", {
              required: "Contribution percentage is required.",
              min: {
                value: 10,
                message: "Minimum charity contribution is 10%.",
              },
              max: {
                value: 100,
                message: "Contribution cannot exceed 100%.",
              },
            })}
          />

          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Already registered?{" "}
          <Link
            className="font-medium text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
            to="/login"
          >
            Log in
          </Link>
        </p>
      </Card>
    </MotionDiv>
  );
}
