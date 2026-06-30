/**
 * Controller to handle custom auth-related logic.
 */

/**
 * Get the current authenticated user's profile.
 * Expects the `protect` middleware to have run and set `req.user`.
 */
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};
