import jwt from "jsonwebtoken"
import User from "../models/userModel.js"

export const Protect = async (req, res, next)=>{
  try {
    let token;

    if( req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
      token = req.headers.authorization.split(" ")[1];
    }

    const decoded = jwt.verify(token , process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password")

    next();
  } catch (error) {
    console.error(error)
    res.status(404).json({message:"Not authorized"})
  }
}