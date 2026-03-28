import AppError from "../utils/appError.js";

const requireSubscription = (req, _res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  if (req.user.role === "admin") {
    return next();
  }

  const status = req.user.subscription?.status;
  const expiryDate = req.user.subscription?.expiryDate
    ? new Date(req.user.subscription.expiryDate)
    : null;

  const isActive =
    status === "active" &&
    expiryDate instanceof Date &&
    !Number.isNaN(expiryDate.valueOf())
      ? expiryDate > new Date()
      : false;

  if (!isActive) {
    return next(new AppError("Active subscription required", 403));
  }

  return next();
};

export default requireSubscription;
