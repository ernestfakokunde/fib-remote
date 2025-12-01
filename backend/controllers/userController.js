import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken"

export const Register = async ( req, res)=>{
 try {
   const { username, email, password } = req.body;

   if(!username || !email || !password){
  return res.status(400).json({ message: "All fields are required" });
   }

   //check if user already exists
   const existingUser = await User.findOne({ email });
   if(existingUser){
    return res.status(400).json({ message: "User already exists" });
   }
   //hash password before saving 

   const salt = await bcrypt.genSalt(10);
   const hashedPassword = await bcrypt.hash(password, salt);

   const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
   });

   res.status(201).json({
    message:"User registered Successfully",
    user:{
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    }
   })

 } catch (error) {
  res.status(500).json({ message: "Server Error" });
  console.error(error);
 }
}

export const Login = async (req, res)=>{
  try {
    const { email, password } = req.body;
    //check for user
    const user = await User.findOne({ email })
    
  //check incase user does not exists
    if(!user){
      return res.status(400).json({ message: "Invalid Credentials or user does not exits"});
    }
    //compare password for login
    const ismatch = await bcrypt.compare(password, user.password);

    if(!ismatch){
      return res.status(400).json({ message: "Password is Invalid"})
    }

  //create jwt token
    const token = jwt.sign(
      {id: user._id}, process.env.JWT_SECRET, { expiresIn: "3d"},
    );

    res.json({
      message:"Login Successfully",
      token,
      user:{
        id:user._id,
        username: user.username,
        email: user.email,
      }
    });

  } catch (error) {
    res.status(500).json({message: "server Error"})
    console.error(error.message)
  }
}

export const getProfile = (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
};