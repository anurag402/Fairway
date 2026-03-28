import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FiCalendar, FiHeart, FiImage, FiInfo } from "react-icons/fi";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { useAuth } from "../hooks/useAuth";
import {
  donateToCharityRequest,
  fetchCharityById,
  fetchMyDonationHistory,
  selectCharityRequest,
} from "../services/charityService";
import { getApiErrorMessage } from "../utils/apiError";

const MotionDiv = motion.div;

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export function CharityProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [charity, setCharity] = useState(null);
  const [selectLoading, setSelectLoading] = useState(false);
  const [donateLoading, setDonateLoading] = useState(false);
  const [percentage, setPercentage] = useState(10);
  const [donationAmount, setDonationAmount] = useState(25);
  const [donationNote, setDonationNote] = useState("");
  const [donations, setDonations] = useState([]);
  const [donationHistoryLoading, setDonationHistoryLoading] = useState(false);

  const loadDonationHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setDonations([]);
      return;
    }

    setDonationHistoryLoading(true);
    try {
      const data = await fetchMyDonationHistory({ limit: 5 });
      setDonations(data.donations || []);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Failed to load donation history."),
      );
    } finally {
      setDonationHistoryLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    async function loadCharity() {
      setLoading(true);
      try {
        const data = await fetchCharityById(id);
        setCharity(data.charity || null);
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, "Failed to load charity profile."),
        );
      } finally {
        setLoading(false);
      }
    }

    loadCharity();
  }, [id]);

  useEffect(() => {
    loadDonationHistory();
  }, [loadDonationHistory]);

  const handleSelectCharity = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/charities/${id}` } });
      return;
    }

    setSelectLoading(true);
    try {
      await selectCharityRequest({
        charityId: id,
        percentage: Number(percentage),
      });
      toast.success("Charity selection updated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to select this charity."));
    } finally {
      setSelectLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/charities/${id}` } });
      return;
    }

    setDonateLoading(true);
    try {
      await donateToCharityRequest(id, {
        amount: Number(donationAmount),
        note: donationNote,
      });
      setDonationNote("");
      toast.success("Independent donation recorded.");
      await loadDonationHistory();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to record donation."));
    } finally {
      setDonateLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Loading charity profile...
        </p>
      </Card>
    );
  }

  if (!charity) {
    return (
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Charity not found.
        </p>
      </Card>
    );
  }

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {charity.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Category: {charity.category || "general"}
          </p>
        </div>
        <Link
          to="/charities"
          className="text-sm font-medium text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
        >
          Back to all charities
        </Link>
      </div>

      <Card>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <FiInfo className="size-4" aria-hidden="true" />
              {charity.description}
            </p>
            <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <FiImage className="size-4" aria-hidden="true" />
              {charity.imageUrl ? "Image available" : "No image provided"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 p-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Set Charity Contribution
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Minimum 10% of subscription fee. You can increase this anytime.
            </p>
            <label className="mt-3 block text-xs uppercase tracking-[0.12em] text-slate-400">
              Contribution (%)
            </label>
            <input
              type="number"
              min={10}
              max={100}
              value={percentage}
              onChange={(event) =>
                setPercentage(Number(event.target.value || 10))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
            />
            <Button
              className="mt-3"
              onClick={handleSelectCharity}
              loading={selectLoading}
            >
              <FiHeart className="size-4" aria-hidden="true" />
              Save Charity Selection
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Upcoming Events
        </h2>
        {(charity.upcomingEvents || []).length === 0 ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            No upcoming events posted yet.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {charity.upcomingEvents.map((event) => (
              <div
                key={event._id || `${event.title}-${event.eventDate}`}
                className="rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 p-3"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {event.title}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <FiCalendar className="size-3.5" aria-hidden="true" />
                  {formatDate(event.eventDate)}
                </p>
                {event.description ? (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {event.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Independent Donation
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Make an extra donation not tied to gameplay or draw outcomes.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.12em] text-slate-400">
              Amount (USD)
            </label>
            <input
              type="number"
              min={1}
              value={donationAmount}
              onChange={(event) =>
                setDonationAmount(Number(event.target.value || 1))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.12em] text-slate-400">
              Note (Optional)
            </label>
            <input
              type="text"
              value={donationNote}
              onChange={(event) => setDonationNote(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
              placeholder="For youth golf day"
            />
          </div>
        </div>
        <Button className="mt-3" onClick={handleDonate} loading={donateLoading}>
          Donate Independently
        </Button>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Your Recent Donations
        </h2>
        {!isAuthenticated ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Log in to view your donation history.
          </p>
        ) : donationHistoryLoading ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Loading donation history...
          </p>
        ) : donations.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            No independent donations recorded yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-400">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Charity</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((item) => (
                  <tr
                    key={item._id}
                    className="rounded-xl bg-slate-50 dark:bg-white/5"
                  >
                    <td className="rounded-l-xl px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-900 dark:text-white">
                      {item.charityId?.name || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                      ${Number(item.amount || 0).toFixed(2)}
                    </td>
                    <td className="rounded-r-xl px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {item.note || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </MotionDiv>
  );
}
