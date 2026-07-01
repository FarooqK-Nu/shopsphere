import ApiError from "../utils/ApiError.js";

/**
 * Middleware to restrict route access to specific roles.
 * @param {...string} roles - List of allowed roles (e.g., 'Admin', 'Customer')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user must exist (should run after protect middleware)
    if (!req.user) {
      throw new ApiError("Authentication required for role verification.", 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError("You do not have permission to perform this action.", 403);
    }

    next();
  };
};
