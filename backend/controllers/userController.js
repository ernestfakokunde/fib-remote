import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Products from '../models/productModel.js';
import { buildPermissions, getProductLimit, getWorkspaceOwnerId } from '../utils/accessScope.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '3d',
  });

const generateSalespersonPassword = () => {
  const seed = Math.random().toString(36).slice(-6);
  return `sales-${seed}${Date.now().toString().slice(-2)}`;
};

const getEffectiveRole = (user) => {
  if (!user) return 'admin';
  if (user.role) return user.role;
  if (user.isAdmin === false) return 'salesperson';
  return 'admin';
};

const getWorkspaceUser = async (user) => {
  if (!user) return null;
  if (getEffectiveRole(user) === 'salesperson' && user.ownerAdmin) {
    return User.findById(user.ownerAdmin);
  }
  return user;
};

const buildProfilePayload = async (user) => {
  const role = getEffectiveRole(user);
  const workspaceUser = await getWorkspaceUser(user);
  const workspaceOwnerId = getWorkspaceOwnerId(user);
  const currentProductCount = workspaceOwnerId
    ? await Products.countDocuments({ createdBy: workspaceOwnerId })
    : 0;

  const subscriptionPlan = workspaceUser?.subscriptionPlan || user.subscriptionPlan || 'free';
  const productLimit = getProductLimit(subscriptionPlan);
  const remainingProducts = productLimit === null ? null : Math.max(productLimit - currentProductCount, 0);
  const permissions = buildPermissions(role);

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role,
    isAdmin: role === 'admin',
    ownerAdmin: user.ownerAdmin || null,
    workspaceOwnerId: workspaceOwnerId?.toString?.() || workspaceOwnerId || null,
    subscriptionPlan,
    currentProductCount,
    productLimit,
    remainingProducts,
    canCreateProduct: permissions.canCreateProduct && (productLimit === null || currentProductCount < productLimit),
    permissions,
  };
};

export const Register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      subscriptionPlan: 'free',
      role: 'admin',
      isAdmin: true,
    });

    res.status(201).json({
      message: 'Admin workspace created successfully',
      user: await buildProfilePayload(newUser),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const identifier = email?.trim();
    const user = await User.findOne({
      $or: [
        { email: identifier?.toLowerCase() },
        { username: identifier },
      ],
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const ismatch = await bcrypt.compare(password, user.password);

    if (!ismatch) {
      return res.status(400).json({ message: 'Password is invalid' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login Successfully',
      token,
      user: await buildProfilePayload(user),
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'server Error' });
  }
};

export const createSalesperson = async (req, res) => {
  try {
    if (getEffectiveRole(req.user) !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create salesperson accounts' });
    }

    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with that email or username already exists' });
    }

    const generatedPassword = generateSalespersonPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);

    const salesperson = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'salesperson',
      isAdmin: false,
      ownerAdmin: req.user._id,
      subscriptionPlan: req.user.subscriptionPlan,
    });

    res.status(201).json({
      message: 'Salesperson account created successfully',
      salesperson: {
        id: salesperson._id,
        username: salesperson.username,
        email: salesperson.email,
      role: getEffectiveRole(salesperson),
        ownerAdmin: salesperson.ownerAdmin,
      },
      generatedPassword,
    });
  } catch (error) {
    console.error('Create salesperson error:', error);
    res.status(500).json({ message: 'Server Error creating salesperson' });
  }
};

export const getSalespeople = async (req, res) => {
  try {
    if (getEffectiveRole(req.user) !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view salesperson accounts' });
    }

    const salespeople = await User.find({ ownerAdmin: req.user._id, role: 'salesperson' })
      .select('username email role ownerAdmin createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, salespeople });
  } catch (error) {
    console.error('Get salespeople error:', error);
    res.status(500).json({ message: 'Server Error loading salesperson accounts' });
  }
};

export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(await buildProfilePayload(req.user));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server Error getting profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username is required to update profile' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.username = username.trim();
    await user.save();

    return res.json({
      message: 'Profile updated successfully',
      user: await buildProfilePayload(user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
