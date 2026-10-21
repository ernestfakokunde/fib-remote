import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Products from '../models/productModel.js';
import { buildPermissions, getProductLimit, getPlanEntitlements, getWorkspaceOwnerId } from '../utils/accessScope.js';
import { randomBytes } from 'node:crypto';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '3d',
  });

const generateSalespersonPassword = () => {
  return `Spx-${randomBytes(12).toString('base64url')}!`;
};

const getEffectiveRole = (user) => {
  if (!user) return 'manager';
  if (user.role === 'admin') return 'manager';
  if (user.role) return user.role;
  if (user.isAdmin === false) return 'salesperson';
  return 'manager';
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
  const entitlements = getPlanEntitlements(subscriptionPlan);
  const currentTeamCount = workspaceOwnerId ? await User.countDocuments({ ownerAdmin: workspaceOwnerId, role: 'salesperson' }) : 0;
  const billingIsActive = ['pro', 'enterprise'].includes(subscriptionPlan)
    && workspaceUser?.subscriptionStatus === 'active'
    && (!workspaceUser.subscriptionCurrentPeriodEnd || new Date(workspaceUser.subscriptionCurrentPeriodEnd) > new Date());
  const remainingProducts = productLimit === null ? null : Math.max(productLimit - currentProductCount, 0);
  const permissions = buildPermissions(role);

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role,
    isAdmin: role === 'manager',
    ownerAdmin: user.ownerAdmin || null,
    workspaceOwnerId: workspaceOwnerId?.toString?.() || workspaceOwnerId || null,
    subscriptionPlan,
    currentProductCount,
    productLimit,
    remainingProducts,
    subscriptionStatus: workspaceUser?.subscriptionStatus || 'free',
    subscriptionCurrentPeriodEnd: workspaceUser?.subscriptionCurrentPeriodEnd || null,
    subscriptionIntroEndsAt: workspaceUser?.subscriptionIntroEndsAt || null,
    currentTeamCount,
    teamLimit: entitlements.team,
    snapsPerDayLimit: billingIsActive ? entitlements.snapsPerDay : 0,
    prices: {
      introductoryUsd: entitlements.introPriceUsd,
      recurringUsd: entitlements.regularPriceUsd,
      billingDays: 60,
    },
    canCreateProduct: permissions.canCreateProduct && (productLimit === null || currentProductCount < productLimit),
    permissions,
  };
};

export const Register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !username.trim() || !email.trim() || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
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
      role: 'manager',
      isAdmin: true,
    });

    res.status(201).json({
      message: 'Manager workspace created successfully',
      user: await buildProfilePayload(newUser),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password, accountType } = req.body;

    const normalizedAccountType = typeof accountType === 'string' ? accountType.trim().toLowerCase() : accountType;
    if (normalizedAccountType && !['manager', 'salesperson', 'superadmin'].includes(normalizedAccountType)) {
      return res.status(400).json({ message: `Account type is invalid: ${String(accountType)}` });
    }

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

    const role = getEffectiveRole(user);
    if (role === 'superadmin' && normalizedAccountType !== 'superadmin') {
      return res.status(403).json({ message: 'Use the platform owner sign-in page.' });
    }
    if (normalizedAccountType && normalizedAccountType !== role) {
      return res.status(403).json({
        message: role === 'superadmin'
          ? 'This is a platform owner account. Use the platform owner sign-in page.'
          : role === 'manager'
          ? 'This is a business owner account. Choose Business owner to sign in.'
          : 'This is a team member account. Choose Team member to sign in.',
      });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login Successfully',
      token,
      user: { ...(await buildProfilePayload(user)), isSuperAdmin: role === 'superadmin' && Boolean(user.isSuperAdmin) },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'server Error' });
  }
};

export const createSalesperson = async (req, res) => {
  try {
    if (getEffectiveRole(req.user) !== 'manager') {
      return res.status(403).json({ message: 'Only managers can create salesperson accounts' });
    }

    const { username, email } = req.body;
    const manager = await User.findById(req.user._id);
    const { team: teamLimit } = getPlanEntitlements(manager?.subscriptionPlan);
    const currentTeamCount = await User.countDocuments({ ownerAdmin: req.user._id, role: 'salesperson' });
    if (teamLimit !== null && currentTeamCount >= teamLimit) {
      return res.status(403).json({ message: `Your ${manager?.subscriptionPlan || 'free'} plan allows up to ${teamLimit} team members. Upgrade to add more.`, currentTeamCount, teamLimit });
    }
    if (typeof username !== 'string' || typeof email !== 'string' || !username.trim() || !email.trim()) {
      return res.status(400).json({ message: 'Username and email are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();
    if (normalizedUsername.length < 2 || normalizedUsername.length > 40) {
      return res.status(400).json({ message: 'Username must be between 2 and 40 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }

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
      subscriptionPlan: manager.subscriptionPlan,
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
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A user with that email or username already exists' });
    }
    console.error('Create salesperson error:', error);
    res.status(500).json({ message: 'Server Error creating salesperson' });
  }
};

export const getSalespeople = async (req, res) => {
  try {
    if (getEffectiveRole(req.user) !== 'manager') {
      return res.status(403).json({ message: 'Only managers can view salesperson accounts' });
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

    res.json({ ...(await buildProfilePayload(req.user)), isSuperAdmin: req.user.role === 'superadmin' && Boolean(req.user.isSuperAdmin) });
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
      user: { ...(await buildProfilePayload(user)), isSuperAdmin: user.role === 'superadmin' && Boolean(user.isSuperAdmin) },
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
