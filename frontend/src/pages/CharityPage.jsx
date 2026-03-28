import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FiFilter, FiHeart, FiInbox, FiSearch } from "react-icons/fi";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useAuth } from "../hooks/useAuth";
import { useCharityStore } from "../store/charityStore";
import { pageVariants } from "../animations/motionVariants";
import {
  fetchCharitiesWithFilters,
  selectCharityRequest,
} from "../services/charityService";
import { getApiErrorMessage } from "../utils/apiError";

const MotionDiv = motion.div;

export function CharityPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingCharity, setPendingCharity] = useState(null);
  const [contributionPercentage, setContributionPercentage] = useState(10);
  const [search, setSearch] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const selectedCharity = useCharityStore((state) => state.selectedCharity);
  const setCharity = useCharityStore((state) => state.setCharity);

  const selectedId = useMemo(
    () => selectedCharity?._id || selectedCharity?.id,
    [selectedCharity],
  );

  useEffect(() => {
    async function loadCharities() {
      setLoading(true);
      try {
        const params = {
          search: search.trim() || undefined,
          featured: featuredOnly || undefined,
          category: categoryFilter || undefined,
        };
        const data = await fetchCharitiesWithFilters(params);
        setCharities(data.charities || []);
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, "Failed to fetch charities right now."),
        );
      } finally {
        setLoading(false);
      }
    }

    loadCharities();
  }, [search, featuredOnly, categoryFilter]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        (charities || []).map((charity) => charity.category || "general"),
      ),
    ];
  }, [charities]);

  const chooseCharity = (charity) => {
    if (!isAuthenticated) {
      toast("Log in to select a charity.");
      navigate("/login", { state: { from: "/charities" } });
      return;
    }

    setPendingCharity(charity);
    setModalOpen(true);
  };

  const confirmSelection = async () => {
    setSelecting(true);
    try {
      await selectCharityRequest({
        charityId: pendingCharity._id,
        percentage: Number(contributionPercentage || 10),
      });
      setCharity(pendingCharity);
      setModalOpen(false);
      toast.success(`${pendingCharity.name} has been selected.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to select charity."));
    } finally {
      setSelecting(false);
    }
  };

  return (
    <MotionDiv
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Choose Your Charity
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Direct at least 10% of your subscription to a cause with transparent
          impact.
        </p>
      </div>

      {!isAuthenticated ? (
        <div className="mb-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/20 p-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="inline-flex items-center gap-2">
            <FiHeart
              className="size-4 text-cyan-600 dark:text-cyan-300"
              aria-hidden="true"
            />
            Browse charities as a visitor. Log in to select your recipient.
          </div>
        </div>
      ) : null}

      {isAuthenticated && !selectedCharity ? (
        <div className="mb-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/20 p-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="inline-flex items-center gap-2">
            <FiHeart
              className="size-4 text-cyan-600 dark:text-cyan-300"
              aria-hidden="true"
            />
            No charity selected yet. Pick one below to personalize your
            contribution flow.
          </div>
        </div>
      ) : null}

      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-slate-400">
              Search
            </label>
            <div className="relative">
              <FiSearch
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search charities"
                className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-slate-400">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant={featuredOnly ? "primary" : "secondary"}
              className="w-full"
              onClick={() => setFeaturedOnly((prev) => !prev)}
            >
              <FiFilter className="size-4" aria-hidden="true" />
              {featuredOnly ? "Showing Featured" : "Filter Featured"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <Card className="md:col-span-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Loading charities...
            </p>
          </Card>
        ) : null}

        {!loading && !charities.length ? (
          <Card className="md:col-span-2">
            <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <FiInbox className="size-4" aria-hidden="true" />
              No active charities found.
            </p>
          </Card>
        ) : null}

        {!loading &&
          charities.map((charity) => {
            const active = charity._id === selectedId;

            return (
              <Card
                key={charity._id}
                hover
                className={active ? "border-cyan-300/45" : ""}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">
                    Active Charity
                  </p>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">
                  {charity.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {charity.description}
                </p>
                <Link
                  to={`/charities/${charity._id}`}
                  className="mt-3 inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
                >
                  View profile
                </Link>
                <Button
                  variant={active ? "secondary" : "primary"}
                  className="mt-5"
                  onClick={() => chooseCharity(charity)}
                >
                  {!isAuthenticated
                    ? "Log in to Select"
                    : active
                      ? "Update Selection"
                      : "Select Charity"}
                </Button>
              </Card>
            );
          })}
      </div>

      <Modal
        open={modalOpen}
        title="Confirm Charity Selection"
        onClose={() => setModalOpen(false)}
      >
        <p className="text-slate-600 dark:text-slate-300">
          Make{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            {pendingCharity?.name}
          </span>{" "}
          your active recipient for subscription contributions?
        </p>
        <label className="mt-4 block text-xs uppercase tracking-[0.12em] text-slate-400">
          Contribution Percentage (minimum 10)
        </label>
        <input
          type="number"
          min={10}
          max={100}
          value={contributionPercentage}
          onChange={(event) =>
            setContributionPercentage(Number(event.target.value || 10))
          }
          className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
        />
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmSelection} loading={selecting}>
            Confirm
          </Button>
        </div>
      </Modal>
    </MotionDiv>
  );
}
