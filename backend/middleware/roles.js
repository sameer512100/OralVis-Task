export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user role found" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }
    next();
  };
