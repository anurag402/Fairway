import { forwardRef, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCalendar, FiEye, FiEyeOff } from "react-icons/fi";
import { cn } from "../utils/cn";

const MotionSvg = motion.svg;

export const InputField = forwardRef(function InputField(
  { label, error, className, type = "text", ...props },
  ref,
) {
  const { onChange, onBlur, value, defaultValue, placeholder, ...inputProps } =
    props;

  const [showPassword, setShowPassword] = useState(false);
  const inputElementRef = useRef(null);

  const isPasswordField = type === "password";
  const isDateField = type === "date";
  const inputType = isPasswordField
    ? showPassword
      ? "text"
      : "password"
    : type;

  const handleChange = (event) => {
    onChange?.(event);
  };

  const handleBlur = (event) => {
    onBlur?.(event);
  };

  const assignInputRef = (node) => {
    inputElementRef.current = node;

    if (typeof ref === "function") {
      ref(node);
      return;
    }

    if (ref) {
      ref.current = node;
    }
  };

  const openDatePicker = () => {
    if (!isDateField || !inputElementRef.current) return;

    if (typeof inputElementRef.current.showPicker === "function") {
      inputElementRef.current.showPicker();
      return;
    }

    inputElementRef.current.focus();
  };

  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <div className="relative">
        <input
          ref={assignInputRef}
          type={inputType}
          className={cn(
            "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-400/30 dark:border-white/15 dark:bg-white/8 dark:text-slate-100 dark:placeholder:text-slate-500",
            (isPasswordField || isDateField) && "pr-11",
            isDateField && "calendar-input",
            error ? "border-rose-300/60 focus:ring-rose-300/40" : "",
            className,
          )}
          onBlur={handleBlur}
          onChange={handleChange}
          placeholder={isDateField ? "" : placeholder}
          value={value}
          defaultValue={defaultValue}
          {...inputProps}
        />

        {isPasswordField ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <AnimatePresence mode="wait" initial={false}>
              {showPassword ? (
                <MotionSvg
                  key="eye-off"
                  className="size-5"
                  initial={{ opacity: 0, scale: 0.8, rotate: -18 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 18 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <FiEyeOff className="size-5" />
                </MotionSvg>
              ) : (
                <MotionSvg
                  key="eye-on"
                  className="size-5"
                  initial={{ opacity: 0, scale: 0.8, rotate: 18 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: -18 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <FiEye className="size-5" />
                </MotionSvg>
              )}
            </AnimatePresence>
          </button>
        ) : null}

        {isDateField ? (
          <>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={openDatePicker}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-cyan-200/70 bg-cyan-50/90 p-1.5 text-cyan-600 shadow-sm transition hover:bg-cyan-100 dark:border-cyan-300/25 dark:bg-cyan-400/10 dark:text-cyan-200 dark:hover:bg-cyan-400/20"
              aria-label="Open calendar"
            >
              <FiCalendar className="size-4.5" />
            </button>
          </>
        ) : null}
      </div>
      {error ? (
        <span className="mt-2 block text-xs text-rose-500 dark:text-rose-300">
          {error}
        </span>
      ) : null}
    </label>
  );
});
