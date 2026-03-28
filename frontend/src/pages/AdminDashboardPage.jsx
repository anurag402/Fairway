import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiDollarSign,
  FiHash,
  FiHeart,
  FiPlay,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiToggleLeft,
  FiToggleRight,
  FiTrash2,
  FiZap,
  FiUsers,
  FiPlusCircle,
  FiExternalLink,
  FiEdit3,
} from "react-icons/fi";
import { Card } from "../components/Card";
import { AdminStatCard } from "../components/AdminStatCard";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useThemeStore } from "../store/themeStore";
import {
  createCharity,
  fetchAdminDonations,
  deleteCharityListing,
  fetchAdminCharities,
  fetchAdminAnalytics,
  fetchLatestDrawRequest,
  fetchAdminUsers,
  publishDrawRequest,
  runMonthlyDrawRequest,
  simulateMonthlyDrawRequest,
  updateCharityListing,
  updateUserSubscriptionRequest,
  updateWinnerStatus,
} from "../services/adminService";
import { getApiErrorMessage } from "../utils/apiError";
import { pageVariants } from "../animations/motionVariants";

const MotionDiv = motion.div;

const PIE_COLORS = ["#10b981", "#f59e0b", "#22d3ee"];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

function formatUpcomingEventsForInput(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return "";
  }

  return events
    .map((event) => {
      const title = String(event?.title || "").trim();
      const eventDate = formatDateForInput(event?.eventDate);
      const description = String(event?.description || "").trim();

      if (!title || !eventDate) return "";

      return `${title}|${eventDate}|${description}`;
    })
    .filter(Boolean)
    .join("\n");
}

function formatDateForInput(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString().slice(0, 10);
}

function parseUpcomingEventsInput(rawInput) {
  const lines = String(rawInput || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const events = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const [titlePart = "", datePart = "", ...restParts] = line
      .split("|")
      .map((part) => part.trim());

    const description = restParts.join(" | ").trim();
    const title = titlePart;
    const eventDate = datePart;

    if (!title || !eventDate) {
      throw new Error(
        `Invalid event format on line ${index + 1}. Use: Title|YYYY-MM-DD|Optional description`,
      );
    }

    const parsedDate = new Date(eventDate);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error(
        `Invalid event date on line ${index + 1}. Use format YYYY-MM-DD.`,
      );
    }

    events.push({
      title,
      eventDate,
      description,
    });
  }

  return events;
}

export function AdminDashboardPage() {
  const theme = useThemeStore((state) => state.theme);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [drawLoading, setDrawLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [drawModalOpen, setDrawModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [simulation, setSimulation] = useState(null);
  const [latestDraw, setLatestDraw] = useState(null);
  const [usersSearchInput, setUsersSearchInput] = useState("");
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(10);
  const [usersSortBy, setUsersSortBy] = useState("createdAt");
  const [usersSortOrder, setUsersSortOrder] = useState("desc");
  const [creatingCharity, setCreatingCharity] = useState(false);
  const [savingCharityDetails, setSavingCharityDetails] = useState(false);
  const [charityEditModalOpen, setCharityEditModalOpen] = useState(false);
  const [editingCharityId, setEditingCharityId] = useState("");
  const [managingSubscriptionUserId, setManagingSubscriptionUserId] =
    useState("");
  const [managingCharityId, setManagingCharityId] = useState("");
  const [adminCharities, setAdminCharities] = useState([]);
  const [adminDonations, setAdminDonations] = useState([]);
  const [adminDonationsLoading, setAdminDonationsLoading] = useState(false);
  const [charityForm, setCharityForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    category: "general",
    featured: false,
    upcomingEventsText: "",
  });
  const [charityEditForm, setCharityEditForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    category: "general",
    featured: false,
    upcomingEventsText: "",
  });
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 10,
    totalUsers: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    totalPrizePool: 0,
    totalCharity: 0,
    totalDraws: 0,
    monthlyData: [],
    winnerDistribution: [],
  });

  const loadAdminDonations = useCallback(async () => {
    setAdminDonationsLoading(true);
    try {
      const data = await fetchAdminDonations({ limit: 10 });
      setAdminDonations(data.donations || []);
    } catch (apiError) {
      toast.error(
        getApiErrorMessage(apiError, "Failed to load donation history."),
      );
    } finally {
      setAdminDonationsLoading(false);
    }
  }, []);

  const loadAdminData = useCallback(
    async ({
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      includeAnalytics = false,
    } = {}) => {
      if (includeAnalytics) {
        setLoading(true);
      } else {
        setUsersLoading(true);
      }
      setError("");

      try {
        if (includeAnalytics) {
          const [usersData, analyticsData, latestDrawData] = await Promise.all([
            fetchAdminUsers({ page, limit, search, sortBy, sortOrder }),
            fetchAdminAnalytics(),
            fetchLatestDrawRequest().catch(() => null),
          ]);

          setUsers(usersData.users || []);
          setUsersPagination(
            usersData.pagination || {
              page,
              limit,
              totalUsers: 0,
              totalPages: 1,
              hasPrevPage: false,
              hasNextPage: false,
            },
          );
          setUsersPage(usersData.pagination?.page || page);
          setUsersPageSize(usersData.pagination?.limit || limit);
          setUsersSearchQuery(usersData.search || "");
          setUsersSearchInput(usersData.search || "");
          setUsersSortBy(usersData.sort?.sortBy || sortBy);
          setUsersSortOrder(usersData.sort?.sortOrder || sortOrder);

          setAnalytics(
            analyticsData.analytics
              ? {
                  totalUsers: analyticsData.analytics.totalUsers || 0,
                  activeSubscribers:
                    analyticsData.analytics.activeSubscribers || 0,
                  totalPrizePool: analyticsData.analytics.totalPrizePool || 0,
                  totalCharity:
                    analyticsData.analytics.totalCharityContributions || 0,
                  totalDraws: analyticsData.analytics.totalDraws || 0,
                  monthlyData: analyticsData.analytics.monthlyData || [],
                  winnerDistribution:
                    analyticsData.analytics.winnerDistribution || [],
                }
              : {
                  totalUsers: analyticsData.totalUsers || 0,
                  activeSubscribers: analyticsData.activeSubscribers || 0,
                  totalPrizePool: analyticsData.totalPrizePool || 0,
                  totalCharity: analyticsData.totalCharity || 0,
                  totalDraws: analyticsData.totalDraws || 0,
                  monthlyData: analyticsData.monthlyData || [],
                  winnerDistribution: analyticsData.winnerDistribution || [],
                },
          );

          setLatestDraw(latestDrawData?.draw || null);
        } else {
          const usersData = await fetchAdminUsers({
            page,
            limit,
            search,
            sortBy,
            sortOrder,
          });

          setUsers(usersData.users || []);
          setUsersPagination(
            usersData.pagination || {
              page,
              limit,
              totalUsers: 0,
              totalPages: 1,
              hasPrevPage: false,
              hasNextPage: false,
            },
          );
          setUsersPage(usersData.pagination?.page || page);
          setUsersPageSize(usersData.pagination?.limit || limit);
          setUsersSearchQuery(usersData.search || "");
          setUsersSortBy(usersData.sort?.sortBy || sortBy);
          setUsersSortOrder(usersData.sort?.sortOrder || sortOrder);
        }
      } catch (apiError) {
        const message = getApiErrorMessage(
          apiError,
          "Failed to load admin data.",
        );
        setError(message);
        toast.error(message);
      } finally {
        if (includeAnalytics) {
          setLoading(false);
        } else {
          setUsersLoading(false);
        }
      }
    },
    [],
  );

  const runDraw = async () => {
    setDrawLoading(true);

    try {
      const result = await runMonthlyDrawRequest();
      setLatestDraw(result.draw || null);
      toast.success(result.message || "Monthly draw completed.");
      await loadAdminData({
        page: usersPage,
        limit: usersPageSize,
        search: usersSearchQuery,
        sortBy: usersSortBy,
        sortOrder: usersSortOrder,
        includeAnalytics: true,
      });
    } catch (apiError) {
      toast.error(getApiErrorMessage(apiError, "Failed to run monthly draw."));
    } finally {
      setDrawLoading(false);
    }
  };

  const publishLatestDraftDraw = async () => {
    if (!latestDraw?._id || latestDraw?.status !== "draft") return;

    setPublishLoading(true);
    try {
      const result = await publishDrawRequest(latestDraw._id);
      setLatestDraw((prev) =>
        prev
          ? {
              ...prev,
              status: "published",
            }
          : prev,
      );
      toast.success(
        result.message ||
          `Draw published. Winners processed: ${result.totalWinners || 0}`,
      );

      await loadAdminData({
        page: usersPage,
        limit: usersPageSize,
        search: usersSearchQuery,
        sortBy: usersSortBy,
        sortOrder: usersSortOrder,
        includeAnalytics: true,
      });
    } catch (apiError) {
      toast.error(getApiErrorMessage(apiError, "Failed to publish draw."));
    } finally {
      setPublishLoading(false);
    }
  };

  const handlePublishDrawConfirm = async () => {
    setPublishModalOpen(false);
    await publishLatestDraftDraw();
  };

  const handleRunDrawConfirm = async () => {
    setDrawModalOpen(false);
    await runDraw();
  };

  const simulateDraw = async () => {
    setSimulateLoading(true);

    try {
      const result = await simulateMonthlyDrawRequest();
      setSimulation(result);
      toast.success("Draw simulation completed. No data was saved.");
    } catch (apiError) {
      toast.error(
        getApiErrorMessage(apiError, "Failed to run draw simulation."),
      );
    } finally {
      setSimulateLoading(false);
    }
  };

  const handleWinnerStatusUpdate = async (userId, status) => {
    setUpdatingUserId(userId);

    try {
      await updateWinnerStatus({ userId, status });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                winnings: {
                  ...user.winnings,
                  status,
                },
              }
            : user,
        ),
      );
      toast.success("Winner status updated.");
    } catch (apiError) {
      toast.error(
        getApiErrorMessage(apiError, "Failed to update winner status."),
      );
    } finally {
      setUpdatingUserId("");
    }
  };

  const handleCharityInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCharityForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditCharityInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCharityEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateCharity = async (event) => {
    event.preventDefault();

    const payload = {
      name: charityForm.name.trim(),
      description: charityForm.description.trim(),
      imageUrl: charityForm.imageUrl.trim(),
      category: charityForm.category.trim() || "general",
      featured: Boolean(charityForm.featured),
    };

    if (!payload.name || !payload.description) {
      toast.error("Charity name and description are required.");
      return;
    }

    try {
      payload.upcomingEvents = parseUpcomingEventsInput(
        charityForm.upcomingEventsText,
      );
    } catch (parseError) {
      toast.error(parseError.message || "Invalid upcoming events format.");
      return;
    }

    setCreatingCharity(true);
    try {
      await createCharity(payload);
      setCharityForm({
        name: "",
        description: "",
        imageUrl: "",
        category: "general",
        featured: false,
        upcomingEventsText: "",
      });
      const charitiesData = await fetchAdminCharities();
      setAdminCharities(charitiesData.charities || []);
      toast.success("Charity created successfully.");
    } catch (apiError) {
      toast.error(getApiErrorMessage(apiError, "Failed to create charity."));
    } finally {
      setCreatingCharity(false);
    }
  };

  const loadAdminCharities = useCallback(async () => {
    try {
      const data = await fetchAdminCharities();
      setAdminCharities(data.charities || []);
    } catch (apiError) {
      toast.error(getApiErrorMessage(apiError, "Failed to load charities."));
    }
  }, []);

  const handleSubscriptionUpdate = async ({ userId, status, plan }) => {
    setManagingSubscriptionUserId(userId);
    try {
      const expiryDate =
        status === "active"
          ? new Date(
              Date.now() + (plan === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000,
            ).toISOString()
          : null;

      const data = await updateUserSubscriptionRequest({
        userId,
        status,
        plan,
        expiryDate,
      });

      setUsers((prevUsers) =>
        prevUsers.map((item) =>
          item._id === userId
            ? {
                ...item,
                subscription: data.subscription,
              }
            : item,
        ),
      );

      toast.success("Subscription updated.");
    } catch (apiError) {
      toast.error(
        getApiErrorMessage(apiError, "Failed to update subscription."),
      );
    } finally {
      setManagingSubscriptionUserId("");
    }
  };

  const handleToggleCharityStatus = async (charity) => {
    setManagingCharityId(charity._id);
    try {
      await updateCharityListing(charity._id, {
        isActive: !charity.isActive,
      });
      await loadAdminCharities();
      toast.success("Charity status updated.");
    } catch (apiError) {
      toast.error(getApiErrorMessage(apiError, "Failed to update charity."));
    } finally {
      setManagingCharityId("");
    }
  };

  const handleDeleteCharity = async (charityId) => {
    setManagingCharityId(charityId);
    try {
      await deleteCharityListing(charityId);
      await loadAdminCharities();
      toast.success("Charity deleted.");
    } catch (apiError) {
      toast.error(getApiErrorMessage(apiError, "Failed to delete charity."));
    } finally {
      setManagingCharityId("");
    }
  };

  const openCharityEditModal = (charity) => {
    setEditingCharityId(charity._id);
    setCharityEditForm({
      name: charity.name || "",
      description: charity.description || "",
      imageUrl: charity.imageUrl || "",
      category: charity.category || "general",
      featured: Boolean(charity.featured),
      upcomingEventsText: formatUpcomingEventsForInput(charity.upcomingEvents),
    });
    setCharityEditModalOpen(true);
  };

  const closeCharityEditModal = () => {
    setCharityEditModalOpen(false);
    setEditingCharityId("");
  };

  const handleSaveCharityDetails = async () => {
    if (!editingCharityId) return;

    const payload = {
      name: charityEditForm.name.trim(),
      description: charityEditForm.description.trim(),
      imageUrl: charityEditForm.imageUrl.trim(),
      category: charityEditForm.category.trim() || "general",
      featured: Boolean(charityEditForm.featured),
    };

    if (!payload.name || !payload.description) {
      toast.error("Charity name and description are required.");
      return;
    }

    try {
      payload.upcomingEvents = parseUpcomingEventsInput(
        charityEditForm.upcomingEventsText,
      );
    } catch (parseError) {
      toast.error(parseError.message || "Invalid upcoming events format.");
      return;
    }

    setSavingCharityDetails(true);
    try {
      await updateCharityListing(editingCharityId, payload);
      await loadAdminCharities();
      closeCharityEditModal();
      toast.success("Charity details updated.");
    } catch (apiError) {
      toast.error(
        getApiErrorMessage(apiError, "Failed to update charity details."),
      );
    } finally {
      setSavingCharityDetails(false);
    }
  };

  const goToPrevPage = async () => {
    if (!usersPagination.hasPrevPage) return;
    await loadAdminData({
      page: usersPage - 1,
      limit: usersPageSize,
      search: usersSearchQuery,
      sortBy: usersSortBy,
      sortOrder: usersSortOrder,
      includeAnalytics: false,
    });
  };

  const goToNextPage = async () => {
    if (!usersPagination.hasNextPage) return;
    await loadAdminData({
      page: usersPage + 1,
      limit: usersPageSize,
      search: usersSearchQuery,
      sortBy: usersSortBy,
      sortOrder: usersSortOrder,
      includeAnalytics: false,
    });
  };

  const handlePageSizeChange = async (event) => {
    const nextLimit = Number(event.target.value);
    await loadAdminData({
      page: 1,
      limit: nextLimit,
      search: usersSearchQuery,
      sortBy: usersSortBy,
      sortOrder: usersSortOrder,
      includeAnalytics: false,
    });
  };

  const handleSortChange = async (nextSortBy) => {
    const nextSortOrder =
      usersSortBy === nextSortBy && usersSortOrder === "asc" ? "desc" : "asc";

    await loadAdminData({
      page: 1,
      limit: usersPageSize,
      search: usersSearchQuery,
      sortBy: nextSortBy,
      sortOrder: nextSortOrder,
      includeAnalytics: false,
    });
  };

  useEffect(() => {
    loadAdminData({
      page: 1,
      limit: 10,
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      includeAnalytics: true,
    });
    loadAdminCharities();
    loadAdminDonations();
  }, [loadAdminData, loadAdminCharities, loadAdminDonations]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const nextSearch = usersSearchInput.trim();
      if (nextSearch === usersSearchQuery) return;

      loadAdminData({
        page: 1,
        limit: usersPageSize,
        search: nextSearch,
        sortBy: usersSortBy,
        sortOrder: usersSortOrder,
        includeAnalytics: false,
      });
    }, 450);

    return () => clearTimeout(debounceTimer);
  }, [
    loadAdminData,
    usersPageSize,
    usersSearchInput,
    usersSearchQuery,
    usersSortBy,
    usersSortOrder,
  ]);

  const isUsersLoading = loading || usersLoading;
  const hasPendingDraft = latestDraw?.status === "draft";
  const monthlySeries = analytics.monthlyData || [];
  const winnerSeries = analytics.winnerDistribution || [];
  const axisColor = theme === "dark" ? "#94a3b8" : "#475569";
  const gridColor =
    theme === "dark" ? "rgba(148,163,184,0.2)" : "rgba(100,116,139,0.25)";
  const tooltipStyle = {
    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
    border:
      theme === "dark"
        ? "1px solid rgba(148,163,184,0.25)"
        : "1px solid rgba(148,163,184,0.45)",
    borderRadius: 12,
    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
  };

  const renderSortIcon = (field) => {
    if (usersSortBy !== field) return null;

    return usersSortOrder === "asc" ? (
      <FiChevronUp className="size-3.5" aria-hidden="true" />
    ) : (
      <FiChevronDown className="size-3.5" aria-hidden="true" />
    );
  };

  return (
    <MotionDiv
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Monitor platform health, users, and monthly draw operations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setPublishModalOpen(true)}
            loading={publishLoading}
            disabled={!latestDraw?._id || latestDraw?.status !== "draft"}
          >
            {!publishLoading ? (
              <FiCheckCircle className="size-4" aria-hidden="true" />
            ) : null}
            Publish Draft Draw
          </Button>
          <Button
            variant="secondary"
            onClick={simulateDraw}
            loading={simulateLoading}
          >
            {!simulateLoading ? (
              <FiActivity className="size-4" aria-hidden="true" />
            ) : null}
            Simulate Draw
          </Button>
          <Button
            onClick={() => setDrawModalOpen(true)}
            loading={drawLoading}
            disabled={hasPendingDraft}
          >
            {!drawLoading ? (
              <FiPlay className="size-4" aria-hidden="true" />
            ) : null}
            Run Monthly Draw
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Draw Publication Status
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Latest draw must be published manually to apply winner payouts.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs ${
              latestDraw?.status === "draft"
                ? "border-amber-300/30 bg-amber-400/10 text-amber-700 dark:text-amber-200"
                : "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
            }`}
          >
            {latestDraw?.status === "draft"
              ? "Draft Pending Publish"
              : latestDraw?.status === "published"
                ? "Published"
                : "No Draw Yet"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
              Month
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {latestDraw?.monthKey || "-"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
              Draw Numbers
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {Array.isArray(latestDraw?.drawNumbers) &&
              latestDraw.drawNumbers.length
                ? latestDraw.drawNumbers.join(", ")
                : "-"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
              Winners
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {latestDraw?.winnerEntries?.length || 0}
            </p>
          </div>
        </div>

        {hasPendingDraft ? (
          <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-200">
            A draft draw is pending. Publish the current draft before running a
            new monthly draw.
          </p>
        ) : null}
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          title="Total Users"
          value={analytics.totalUsers}
          icon={<FiUsers className="size-4" aria-hidden="true" />}
          loading={loading}
          index={0}
        />
        <AdminStatCard
          title="Active Users (Excl. Admin)"
          value={analytics.activeSubscribers}
          icon={<FiActivity className="size-4" aria-hidden="true" />}
          loading={loading}
          index={1}
        />
        <AdminStatCard
          title="Total Prize Pool"
          value={formatCurrency(analytics.totalPrizePool)}
          icon={<FiDollarSign className="size-4" aria-hidden="true" />}
          loading={loading}
          index={2}
        />
        <AdminStatCard
          title="Total Charity Contributions"
          value={formatCurrency(analytics.totalCharity)}
          icon={<FiHeart className="size-4" aria-hidden="true" />}
          loading={loading}
          index={3}
        />
        <AdminStatCard
          title="Total Draws"
          value={analytics.totalDraws}
          icon={<FiBarChart2 className="size-4" aria-hidden="true" />}
          loading={loading}
          index={4}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MotionDiv
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Add Charity
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Create a new charity option for users to select.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-700 dark:text-cyan-200">
                <FiPlusCircle className="size-4" aria-hidden="true" />
                Admin Only
              </span>
            </div>

            <form
              onSubmit={handleCreateCharity}
              className="mt-4 grid gap-3 md:grid-cols-2"
            >
              <div>
                <label
                  htmlFor="charity-name"
                  className="mb-1.5 block text-xs uppercase tracking-widest text-slate-400"
                >
                  Charity Name
                </label>
                <input
                  id="charity-name"
                  name="name"
                  value={charityForm.name}
                  onChange={handleCharityInputChange}
                  placeholder="Example: Birdies for Education"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="charity-image"
                  className="mb-1.5 block text-xs uppercase tracking-widest text-slate-400"
                >
                  Image URL (Optional)
                </label>
                <input
                  id="charity-image"
                  name="imageUrl"
                  value={charityForm.imageUrl}
                  onChange={handleCharityInputChange}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="charity-category"
                  className="mb-1.5 block text-xs uppercase tracking-widest text-slate-400"
                >
                  Category
                </label>
                <input
                  id="charity-category"
                  name="category"
                  value={charityForm.category}
                  onChange={handleCharityInputChange}
                  placeholder="education"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={charityForm.featured}
                    onChange={handleCharityInputChange}
                    className="size-4 rounded border-slate-300"
                  />
                  Featured charity
                </label>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="charity-description"
                  className="mb-1.5 block text-xs uppercase tracking-widest text-slate-400"
                >
                  Description
                </label>
                <textarea
                  id="charity-description"
                  name="description"
                  value={charityForm.description}
                  onChange={handleCharityInputChange}
                  rows={3}
                  placeholder="What impact does this charity make?"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="charity-events"
                  className="mb-1.5 block text-xs uppercase tracking-widest text-slate-400"
                >
                  Upcoming Events (one per line)
                </label>
                <textarea
                  id="charity-events"
                  name="upcomingEventsText"
                  value={charityForm.upcomingEventsText}
                  onChange={handleCharityInputChange}
                  rows={3}
                  placeholder="Fundraiser Scramble|2026-06-12|18-hole charity event"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Format: Title|YYYY-MM-DD|Optional description
                </p>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" loading={creatingCharity}>
                  <FiPlusCircle className="size-4" aria-hidden="true" />
                  Create Charity
                </Button>
              </div>
            </form>
          </Card>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.03 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-xl p-6 shadow-lg">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Manage Charity Listings
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Toggle visibility and remove outdated charities.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {adminCharities.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No charity listings found.
                </p>
              ) : (
                adminCharities.map((charity) => (
                  <div
                    key={charity._id}
                    className="rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {charity.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            {charity.isActive ? "Active" : "Inactive"}
                          </span>
                          <span>Category: {charity.category || "general"}</span>
                          {charity.featured ? (
                            <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-cyan-700 dark:text-cyan-200">
                              Featured
                            </span>
                          ) : null}
                          <span>
                            Events: {(charity.upcomingEvents || []).length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        className="px-3 py-2 text-xs"
                        onClick={() => openCharityEditModal(charity)}
                        disabled={managingCharityId === charity._id}
                      >
                        <FiEdit3 className="size-4" aria-hidden="true" />
                        Edit Details
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        loading={managingCharityId === charity._id}
                        onClick={() => handleToggleCharityStatus(charity)}
                      >
                        {charity.isActive ? (
                          <FiToggleRight
                            className="size-4"
                            aria-hidden="true"
                          />
                        ) : (
                          <FiToggleLeft className="size-4" aria-hidden="true" />
                        )}
                        {charity.isActive ? "Set Inactive" : "Set Active"}
                      </Button>
                      <Button
                        variant="danger"
                        className="px-3 py-2 text-xs"
                        loading={managingCharityId === charity._id}
                        onClick={() => handleDeleteCharity(charity._id)}
                      >
                        <FiTrash2 className="size-4" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <Card className="rounded-xl p-6 shadow-lg">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Monthly Prize Pool Growth
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Trend of total prize pool per month.
            </p>
            {loading ? (
              <div className="mt-4 h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-white/8" />
            ) : monthlySeries.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 dark:border-white/20 p-6 text-sm text-slate-600 dark:text-slate-300">
                No monthly draw analytics available yet.
              </p>
            ) : (
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlySeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                      dataKey="month"
                      stroke={axisColor}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={tooltipStyle}
                    />
                    <Line
                      type="monotone"
                      dataKey="prizePool"
                      stroke="#22d3ee"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <Card className="rounded-xl p-6 shadow-lg">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Winners Per Draw
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Number of winners recorded in each draw cycle.
            </p>
            {loading ? (
              <div className="mt-4 h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-white/8" />
            ) : monthlySeries.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 dark:border-white/20 p-6 text-sm text-slate-600 dark:text-slate-300">
                No winner-per-draw data available yet.
              </p>
            ) : (
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                      dataKey="month"
                      stroke={axisColor}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      wrapperStyle={{
                        color: theme === "dark" ? "#cbd5e1" : "#334155",
                      }}
                    />
                    <Bar
                      dataKey="winnerCount"
                      name="Winners"
                      fill="#38bdf8"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-xl p-6 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Winner Distribution
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Split of 5-match, 4-match, and 3-match winners.
                </p>
              </div>
              {error ? (
                <p className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200">
                  Analytics fetch failed. Showing only persisted values.
                </p>
              ) : null}
            </div>
            {loading ? (
              <div className="mt-4 h-80 animate-pulse rounded-xl bg-slate-100 dark:bg-white/8" />
            ) : winnerSeries.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 dark:border-white/20 p-6 text-sm text-slate-600 dark:text-slate-300">
                No winner distribution data available yet.
              </p>
            ) : (
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={winnerSeries}
                      dataKey="count"
                      nameKey="matchType"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label
                    >
                      {winnerSeries.map((entry, index) => (
                        <Cell
                          key={`${entry.matchType}-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      wrapperStyle={{
                        color: theme === "dark" ? "#cbd5e1" : "#334155",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </MotionDiv>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Simulation Preview
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Run a safe dry-run for winners and payouts. This does not persist
              to the database.
            </p>
          </div>
          {simulation ? (
            <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-700 dark:text-cyan-200">
              Preview Ready
            </span>
          ) : null}
        </div>

        {!simulation ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-200 dark:border-white/20 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
            <FiZap className="size-4" aria-hidden="true" />
            Click Simulate Draw to preview winners and payouts.
          </p>
        ) : (
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                Draw Numbers
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(simulation.drawNumbers || []).map((value) => (
                  <span
                    key={value}
                    className="inline-flex min-w-8 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-400/10 px-2.5 py-1 text-sm font-semibold text-cyan-700 dark:text-cyan-100"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  Total Winners
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
                  <FiUsers
                    className="size-5 text-cyan-600 dark:text-cyan-300"
                    aria-hidden="true"
                  />
                  {simulation.summary?.totalWinners || 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  5-Match Pool
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                  <FiAward
                    className="size-4 text-emerald-600 dark:text-emerald-300"
                    aria-hidden="true"
                  />
                  {formatCurrency(
                    simulation.summary?.prizeBreakdown?.["5-match"]?.pool,
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  4-Match Pool
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                  <FiAward
                    className="size-4 text-amber-600 dark:text-amber-300"
                    aria-hidden="true"
                  />
                  {formatCurrency(
                    simulation.summary?.prizeBreakdown?.["4-match"]?.pool,
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  3-Match Pool
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                  <FiAward
                    className="size-4 text-cyan-600 dark:text-cyan-300"
                    aria-hidden="true"
                  />
                  {formatCurrency(
                    simulation.summary?.prizeBreakdown?.["3-match"]?.pool,
                  )}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest text-slate-400">
                    <th className="px-3 py-2">User ID</th>
                    <th className="px-3 py-2">Match Type</th>
                    <th className="px-3 py-2">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {(simulation.winners || []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-6 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <span className="inline-flex items-center gap-2">
                          <FiZap className="size-4" aria-hidden="true" />
                          No simulated winners for this draw.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    (simulation.winners || []).map((winner) => (
                      <tr
                        key={`${winner.userId}-${winner.matchType}`}
                        className="rounded-xl bg-slate-50 dark:bg-white/5"
                      >
                        <td className="rounded-l-xl px-3 py-3 text-sm text-slate-900 dark:text-white">
                          <span className="inline-flex items-center gap-2">
                            <FiHash
                              className="size-3.5 text-slate-400"
                              aria-hidden="true"
                            />
                            {winner.userId}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
                          {winner.matchType}
                        </td>
                        <td className="rounded-r-xl px-3 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                          {formatCurrency(winner.prize)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Independent Donation History
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Latest user donations recorded outside subscription payments.
        </p>

        {adminDonationsLoading ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Loading donations...
          </p>
        ) : adminDonations.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            No independent donations recorded yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-400">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Charity</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {adminDonations.map((item) => (
                  <tr
                    key={item._id}
                    className="rounded-xl bg-slate-50 dark:bg-white/5"
                  >
                    <td className="rounded-l-xl px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-900 dark:text-white">
                      {item.userId?.name || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-900 dark:text-white">
                      {item.charityId?.name || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                      {formatCurrency(item.amount)}
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

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Users
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Name, email, and subscription status overview.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-55 flex-1">
            <FiSearch
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              value={usersSearchInput}
              onChange={(event) => setUsersSearchInput(event.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300">
            <span>Rows</span>
            <select
              value={usersPageSize}
              onChange={handlePageSizeChange}
              className="rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-800 dark:text-slate-100 focus:border-cyan-300/60 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>

          <Button
            type="button"
            variant="ghost"
            className="px-4 py-2.5"
            onClick={() => {
              setUsersSearchInput("");
            }}
          >
            Clear
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <p>
            Showing page {usersPagination.page} of {usersPagination.totalPages}.
            Total users: {usersPagination.totalUsers}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="px-3 py-1.5 text-xs"
              disabled={!usersPagination.hasPrevPage || isUsersLoading}
              onClick={goToPrevPage}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              className="px-3 py-1.5 text-xs"
              disabled={!usersPagination.hasNextPage || isUsersLoading}
              onClick={goToNextPage}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-slate-400">
                <th className="px-3 py-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200"
                    onClick={() => handleSortChange("name")}
                  >
                    Name
                    {renderSortIcon("name")}
                  </button>
                </th>
                <th className="px-3 py-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200"
                    onClick={() => handleSortChange("email")}
                  >
                    Email
                    {renderSortIcon("email")}
                  </button>
                </th>
                <th className="px-3 py-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200"
                    onClick={() => handleSortChange("createdAt")}
                  >
                    Created
                    {renderSortIcon("createdAt")}
                  </button>
                </th>
                <th className="px-3 py-2">Subscription</th>
                <th className="px-3 py-2">Winner Proof</th>
                <th className="px-3 py-2">Winner Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-sm text-slate-600 dark:text-slate-300"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FiUsers className="size-4" aria-hidden="true" />
                      No users found.
                    </span>
                  </td>
                </tr>
              ) : null}

              {(isUsersLoading ? Array.from({ length: 4 }) : users).map(
                (user, index) => (
                  <tr
                    key={user?._id || `skeleton-${index}`}
                    className="rounded-xl bg-slate-50 dark:bg-white/5"
                  >
                    <td className="rounded-l-xl px-3 py-3 text-sm text-slate-900 dark:text-white">
                      {isUsersLoading ? "Loading..." : user.name}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {isUsersLoading ? "Loading..." : user.email}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {isUsersLoading
                        ? "Loading..."
                        : formatDate(user.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {isUsersLoading
                        ? "Loading..."
                        : `${user.subscription?.status || "inactive"} · ${
                            user.subscription?.plan || "none"
                          }`}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {isUsersLoading ? (
                        "Loading..."
                      ) : user.winnings?.proofUrl ? (
                        <a
                          href={user.winnings.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
                        >
                          <FiExternalLink
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          View
                        </a>
                      ) : (
                        "Not submitted"
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {isUsersLoading
                        ? "Loading..."
                        : user.winnings?.status || "pending"}
                    </td>
                    <td className="rounded-r-xl px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {isUsersLoading ? (
                        "Loading..."
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            className="px-3 py-2 text-xs"
                            disabled={
                              managingSubscriptionUserId === user._id ||
                              user.role === "admin"
                            }
                            onClick={() =>
                              handleSubscriptionUpdate({
                                userId: user._id,
                                status: "active",
                                plan: "monthly",
                              })
                            }
                          >
                            <FiShield className="size-4" aria-hidden="true" />
                            Activate 30d
                          </Button>
                          <Button
                            variant="warning"
                            className="px-3 py-2 text-xs"
                            disabled={
                              managingSubscriptionUserId === user._id ||
                              user.role === "admin"
                            }
                            onClick={() =>
                              handleSubscriptionUpdate({
                                userId: user._id,
                                status: "expired",
                                plan: "none",
                              })
                            }
                          >
                            Expire
                          </Button>
                          <Button
                            variant="success"
                            className="px-3 py-2 text-xs"
                            disabled={
                              updatingUserId === user._id ||
                              user.winnings?.status === "paid"
                            }
                            onClick={() =>
                              handleWinnerStatusUpdate(user._id, "paid")
                            }
                          >
                            <FiCheckCircle
                              className="size-4"
                              aria-hidden="true"
                            />
                            Mark Paid
                          </Button>
                          <Button
                            variant="warning"
                            className="px-3 py-2 text-xs"
                            disabled={
                              updatingUserId === user._id ||
                              user.winnings?.status === "pending"
                            }
                            onClick={() =>
                              handleWinnerStatusUpdate(user._id, "pending")
                            }
                          >
                            {updatingUserId === user._id ? (
                              <FiRefreshCw
                                className="size-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <FiClock className="size-4" aria-hidden="true" />
                            )}
                            Set Pending
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={charityEditModalOpen}
        title="Edit Charity Details"
        onClose={closeCharityEditModal}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-widest text-slate-400">
              Charity Name
            </label>
            <input
              name="name"
              value={charityEditForm.name}
              onChange={handleEditCharityInputChange}
              className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-widest text-slate-400">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={charityEditForm.description}
              onChange={handleEditCharityInputChange}
              className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-widest text-slate-400">
                Image URL
              </label>
              <input
                name="imageUrl"
                value={charityEditForm.imageUrl}
                onChange={handleEditCharityInputChange}
                className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-widest text-slate-400">
                Category
              </label>
              <input
                name="category"
                value={charityEditForm.category}
                onChange={handleEditCharityInputChange}
                className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              name="featured"
              checked={charityEditForm.featured}
              onChange={handleEditCharityInputChange}
              className="size-4 rounded border-slate-300"
            />
            Featured charity
          </label>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-widest text-slate-400">
              Upcoming Events (one per line)
            </label>
            <textarea
              name="upcomingEventsText"
              rows={4}
              value={charityEditForm.upcomingEventsText}
              onChange={handleEditCharityInputChange}
              placeholder="Fundraiser Scramble|2026-06-12|18-hole charity event"
              className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Format: Title|YYYY-MM-DD|Optional description
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={closeCharityEditModal}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveCharityDetails}
            loading={savingCharityDetails}
          >
            <FiCheckCircle className="size-4" aria-hidden="true" />
            Save Changes
          </Button>
        </div>
      </Modal>

      <Modal
        open={drawModalOpen}
        title="Confirm Monthly Draw"
        onClose={() => setDrawModalOpen(false)}
      >
        <p className="text-slate-600 dark:text-slate-300">
          This will execute the real monthly draw and persist results to the
          database. Continue?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDrawModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRunDrawConfirm} loading={drawLoading}>
            <FiPlay className="size-4" aria-hidden="true" />
            Confirm Run Draw
          </Button>
        </div>
      </Modal>

      <Modal
        open={publishModalOpen}
        title="Publish Draft Draw"
        onClose={() => setPublishModalOpen(false)}
      >
        <p className="text-slate-600 dark:text-slate-300">
          Publishing will apply payouts to winners and mark the draw as
          published. This action should only be done after review. Continue?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setPublishModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handlePublishDrawConfirm} loading={publishLoading}>
            <FiCheckCircle className="size-4" aria-hidden="true" />
            Confirm Publish
          </Button>
        </div>
      </Modal>
    </MotionDiv>
  );
}
