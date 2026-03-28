import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCloudOff, FiEdit2, FiTrash2, FiUploadCloud } from "react-icons/fi";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { InputField } from "../components/InputField";
import { useScores } from "../hooks/useScores";
import { getScoreFieldRules } from "../utils/formRules";
import { pageVariants } from "../animations/motionVariants";
import {
  addUserScore,
  deleteUserScore,
  fetchUserScores,
  updateUserScore,
} from "../services/userService";
import { getApiErrorMessage } from "../utils/apiError";

const MotionDiv = motion.div;
const MotionLi = motion.li;

export function ScorePage() {
  const { scores, setScores } = useScores();
  const scoreRules = getScoreFieldRules();
  const [submitting, setSubmitting] = useState(false);
  const [mutatingScoreId, setMutatingScoreId] = useState("");
  const [editingScoreId, setEditingScoreId] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editDate, setEditDate] = useState("");
  const [loading, setLoading] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      value: "",
      date: "",
    },
  });

  useEffect(() => {
    async function loadScores() {
      setLoading(true);
      try {
        const data = await fetchUserScores();
        setScores(data.scores || []);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load scores."));
      } finally {
        setLoading(false);
      }
    }

    loadScores();
  }, [setScores]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const data = await addUserScore({
        value: Number(formData.value),
        date: formData.date,
      });
      setScores(data.scores || []);
      reset();
      toast.success("Score saved. Latest 5 scores updated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save score."));
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (score) => {
    const normalizedDate = score?.date
      ? new Date(score.date).toISOString().slice(0, 10)
      : "";

    setEditingScoreId(score._id || score.id);
    setEditValue(String(score.value));
    setEditDate(normalizedDate);
  };

  const cancelEditing = () => {
    setEditingScoreId("");
    setEditValue("");
    setEditDate("");
  };

  const saveEditing = async (scoreId) => {
    setMutatingScoreId(scoreId);
    try {
      const data = await updateUserScore(scoreId, {
        value: Number(editValue),
        date: editDate,
      });
      setScores(data.scores || []);
      cancelEditing();
      toast.success("Score updated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update score."));
    } finally {
      setMutatingScoreId("");
    }
  };

  const removeScore = async (scoreId) => {
    setMutatingScoreId(scoreId);
    try {
      const data = await deleteUserScore(scoreId);
      setScores(data.scores || []);
      toast.success("Score removed.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete score."));
    } finally {
      setMutatingScoreId("");
    }
  };

  return (
    <MotionDiv
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="grid gap-4 xl:grid-cols-[minmax(0,420px)_1fr]"
    >
      <Card>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          Add New Score
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Enter a Stableford score between 1 and 45. The list keeps only the
          latest 5 entries.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <InputField
            label="Score"
            type="number"
            min={1}
            max={45}
            error={errors.value?.message}
            placeholder="e.g. 33"
            {...register("value", scoreRules.value)}
          />
          <InputField
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register("date", scoreRules.date)}
          />
          <Button type="submit" className="w-full" loading={submitting}>
            Save Score
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Recent Scores
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Live list with animated updates and FIFO trimming.
        </p>

        {loading ? (
          <p className="mt-5 rounded-xl border border-slate-200 dark:border-white/20 p-6 text-slate-600 dark:text-slate-300">
            Loading scores...
          </p>
        ) : null}

        {!loading && !scores.length ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 dark:border-white/20 p-6 text-slate-600 dark:text-slate-300">
            <div className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <FiCloudOff className="size-4" aria-hidden="true" />
              No scores yet. Add your first score to begin.
            </div>
          </div>
        ) : null}

        <motion.ul layout className="mt-4 space-y-2">
          <AnimatePresence>
            {scores.map((score) => (
              <MotionLi
                layout
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                key={score._id || score.id || `${score.date}-${score.value}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/6 p-3"
              >
                <div>
                  {editingScoreId === (score._id || score.id) ? (
                    <div className="space-y-2">
                      <input
                        type="number"
                        min={1}
                        max={45}
                        value={editValue}
                        onChange={(event) => setEditValue(event.target.value)}
                        className="w-24 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 px-2 py-1 text-sm"
                      />
                      <input
                        type="date"
                        value={editDate}
                        onChange={(event) => setEditDate(event.target.value)}
                        className="rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 px-2 py-1 text-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {score.date}
                      </p>
                      <p className="text-xl font-semibold text-slate-900 dark:text-white">
                        {score.value}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 dark:border-white/15 px-3 py-1 text-xs text-slate-600 dark:text-slate-300">
                    <FiUploadCloud
                      className="mr-1 inline size-3.5"
                      aria-hidden="true"
                    />
                    Synced
                  </span>
                  {editingScoreId === (score._id || score.id) ? (
                    <>
                      <Button
                        variant="success"
                        className="px-3 py-1.5 text-xs"
                        loading={mutatingScoreId === (score._id || score.id)}
                        onClick={() => saveEditing(score._id || score.id)}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-3 py-1.5 text-xs"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => startEditing(score)}
                      >
                        <FiEdit2 className="size-3.5" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="px-3 py-1.5 text-xs"
                        loading={mutatingScoreId === (score._id || score.id)}
                        onClick={() => removeScore(score._id || score.id)}
                      >
                        <FiTrash2 className="size-3.5" aria-hidden="true" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </MotionLi>
            ))}
          </AnimatePresence>
        </motion.ul>
      </Card>
    </MotionDiv>
  );
}
