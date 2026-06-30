import { auth } from "../config/auth.js";
import ApiError from "../utils/ApiError.js";

/**
 * Middleware to protect routes: validates the session (via cookies or Bearer token)
 * and attaches the authenticated user to the request object.
 */
export const protect = async (req, res, next) => {
  try {
    // Retrieve session from Better Auth by forwarding headers
    const sessionData = await auth.api.getSession({
      headers: req.headers
    });

    if (!sessionData || !sessionData.user) {
      return next(new ApiError("You are not logged in! Please log in to get access.", 401));
    }

    // Attach user and session details to request context
    req.user = sessionData.user;
    req.session = sessionData.session;

    next();
  } catch (error) {
    next(error);
  }
};
