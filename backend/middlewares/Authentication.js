import jwt from "jsonwebtoken"
import User from "../models/userModel.js"
import { getWorkspaceOwnerId } from "../utils/accessScope.js";

const getEffectiveRole = (user) => {
  if (!user) return "manager";
  if (user.role === "admin") return "manager";
  if (user.role) return user.role;
  if (user.isAdmin === false) return "salesperson";
  return "manager";
};

export const Protect = async (req, res, next)=>{
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
    if (!token) {
      return res.status(401).json({ message: "Authentication token is missing. Please sign in again." });
    }
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured.');
      return res.status(500).json({ message: "Authentication is not configured on the server." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Your session has expired. Please sign in again." });
      }
      return res.status(401).json({ message: "Your session is invalid. Please sign in again." });
    }

    // `+field` is an inclusion projection and cannot be combined with excluding
    // password. isSuperAdmin is selected by default, so only exclude the hash.
    req.user = await User.findById(decoded.id).select("-password")
    if (!req.user) {
      return res.status(401).json({message:"Account for this session was not found. Please sign in again."})
    }
    req.user.role = getEffectiveRole(req.user);
    req.workspaceOwnerId = getWorkspaceOwnerId(req.user);

    if (req.user.role === "salesperson" && !req.user.ownerAdmin) {
      return res.status(403).json({ message: "Salesperson account is not linked to a manager workspace" });
    }

    next();
  } catch (error) {
    console.error('Authentication lookup failed:', error);
    res.status(500).json({message:"Could not verify your account. Check the server database connection."})
  }
}

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const role = getEffectiveRole(req.user);
  const normalizedRoles = roles.map((item) => (item === "admin" ? "manager" : item));

  if (!normalizedRoles.includes(role)) {
    return res.status(403).json({ message: "You are not allowed to perform this action" });
  }

  next();
};
