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
    let token;

    if( req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
      token = req.headers.authorization.split(" ")[1];
    }

    const decoded = jwt.verify(token , process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password")
    if (!req.user) {
      return res.status(401).json({message:"Not authorized"})
    }
    req.user.role = getEffectiveRole(req.user);
    req.workspaceOwnerId = getWorkspaceOwnerId(req.user);

    if (req.user.role === "salesperson" && !req.user.ownerAdmin) {
      return res.status(403).json({ message: "Salesperson account is not linked to a manager workspace" });
    }

    next();
  } catch (error) {
    console.error(error)
    res.status(404).json({message:"Not authorized"})
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
