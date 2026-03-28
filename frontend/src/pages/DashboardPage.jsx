import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FiAward,
  FiCalendar,
  FiHeart,
  FiLink,
  FiSave,
  FiTrendingUp,
  FiUpload,
} from "react-icons/fi";
import { Card } from "../components/Card";
import { Skeleton } from "../components/Loader";
import { Button } from "../components/Button";
import { useAuth } from "../hooks/useAuth";
import { useScores } from "../hooks/useScores";
import { useCharityStore } from "../store/charityStore";
import { pageVariants } from "../animations/motionVariants";
import {
  fetchUserProfile,
  updateUserProfile,
  uploadWinnerProof,
} from "../services/userService";
import { createSubscriptionSession } from "../services/subscriptionService";
import { getApiErrorMessage } from "../utils/apiError";

const MotionDiv = motion.div;

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function DashboardPage() {
  const location = useLocation();
  const { user, setUser } = useAuth();
  const { scores, average } = useScores();
  const selectedCharity = useCharityStore((state) => state.selectedCharity);
  const [loading, setLoading] = useState(true);
  const [subscribingPlan, setSubscribingPlan] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const data = await fetchUserProfile();
        if (data?.user) {
          setUser(data.user);
          setDisplayName(data.user.name || "");
          setProofUrl(data.user.winnings?.proofUrl || "");
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load your profile."));
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [setUser]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const subscriptionResult = params.get("subscription");

    if (subscriptionResult === "success") {
      toast.success("Subscription payment confirmed.");
    }

    if (subscriptionResult === "cancel") {
      toast("Subscription checkout was canceled.");
    }
  }, [location.search]);

  const handleSubscribe = async (plan) => {
    setSubscribingPlan(plan);

    try {
      const data = await createSubscriptionSession(plan);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      toast.error("Unable to start checkout. Missing Stripe URL.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to start checkout."));
    } finally {
      setSubscribingPlan("");
    }
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const data = await updateUserProfile({ name: displayName });
      if (data?.user) {
        setUser(data.user);
      }
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleWinnerProofUpload = async () => {
    setUploadingProof(true);
    try {
      const data = await uploadWinnerProof({ proofUrl });
      setUser({
        ...(user || {}),
        winnings: {
          ...(user?.winnings || {}),
          ...(data?.winnings || {}),
        },
      });
      toast.success("Winner proof submitted.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to upload winner proof."));
    } finally {
      setUploadingProof(false);
    }
  };

  const subscriptionStatus = user?.subscription?.status || "inactive";
  const subscriptionPlan = user?.subscription?.plan || "none";
  const renewalDate = formatDate(user?.subscription?.expiryDate);
  const winningsAmount = user?.winnings?.amount || 0;
  const winningsStatus = user?.winnings?.status || "none";

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <MotionDiv
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-4"
    >
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        Welcome back, {user?.name || "Member"}.
      </h1>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center gap-2 text-slate-400">
            <FiCalendar className="size-4" />
            <p className="text-xs uppercase tracking-[0.14em]">Subscription</p>
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
            {`${subscriptionStatus} · ${subscriptionPlan}`}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Renewal: {renewalDate}
          </p>
          {subscriptionStatus !== "active" ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button
                className="w-full"
                loading={subscribingPlan === "monthly"}
                onClick={() => handleSubscribe("monthly")}
              >
                Subscribe Monthly
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                loading={subscribingPlan === "yearly"}
                onClick={() => handleSubscribe("yearly")}
              >
                Subscribe Yearly
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-xs text-emerald-700 dark:text-emerald-300">
              Your subscription is active.
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-slate-400">
            <FiTrendingUp className="size-4" />
            <p className="text-xs uppercase tracking-[0.14em]">
              Recent Average
            </p>
          </div>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
            {average}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Across {scores.length} submitted scores
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-slate-400">
            <FiHeart className="size-4" />
            <p className="text-xs uppercase tracking-[0.14em]">
              Selected Charity
            </p>
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
            {selectedCharity?.name || "Not selected"}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {selectedCharity?.focus ||
              "Pick a charity to direct contributions."}
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-slate-400">
            <FiAward className="size-4" />
            <p className="text-xs uppercase tracking-[0.14em]">Winnings</p>
          </div>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
            {formatMoney(winningsAmount)}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Payment status: {winningsStatus}
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Last 5 scores
          </h2>
          <span className="rounded-full border border-slate-200 dark:border-white/15 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
            FIFO Retention Active
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {scores.map((score) => (
            <div
              key={score._id || score.id || `${score.date}-${score.value}`}
              className="rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/6 p-3"
            >
              <p className="text-xs text-slate-400">{score.date}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                {score.value}
              </p>
              <p className="text-xs text-slate-400">Stableford</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Profile Settings
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Update your display name.
          </p>
          <div className="mt-4 space-y-3">
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Display name"
              className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none"
            />
            <Button loading={savingProfile} onClick={handleProfileSave}>
              <FiSave className="size-4" aria-hidden="true" />
              Save Profile
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Winner Proof Upload
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Submit a proof link for your winnings verification.
          </p>
          <div className="mt-4 space-y-3">
            <input
              value={proofUrl}
              onChange={(event) => setProofUrl(event.target.value)}
              placeholder="https://your-proof-link"
              className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                loading={uploadingProof}
                onClick={handleWinnerProofUpload}
              >
                <FiUpload className="size-4" aria-hidden="true" />
                Upload Proof
              </Button>
              {user?.winnings?.proofUrl ? (
                <a
                  href={user.winnings.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
                >
                  <FiLink className="size-4" aria-hidden="true" />
                  View Current Proof
                </a>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </MotionDiv>
  );
}
