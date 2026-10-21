import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/userModel.js';

const args = process.argv.slice(2);
const readOption = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const prompt = (label) => new Promise((resolve, reject) => {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    reject(new Error('Run this command in an interactive terminal so the password can be entered securely.'));
    return;
  }

  const input = [];
  const wasRaw = process.stdin.isRaw;
  process.stdout.write(label);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  const onData = (chunk) => {
    for (const byte of chunk) {
      if (byte === 3) {
        process.stdin.off('data', onData);
        process.stdin.setRawMode(wasRaw || false);
        reject(new Error('Cancelled.'));
        return;
      }
      if (byte === 13 || byte === 10) {
        process.stdin.off('data', onData);
        process.stdin.setRawMode(wasRaw || false);
        process.stdout.write('\n');
        resolve(Buffer.from(input).toString('utf8'));
        return;
      }
      if (byte === 127 || byte === 8) {
        input.pop();
        continue;
      }
      if (byte >= 32) input.push(byte);
    }
  };
  process.stdin.on('data', onData);
});

const run = async () => {
  const email = readOption('email')?.trim().toLowerCase();
  const usernameOption = readOption('username')?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Provide a valid email: npm run create-super-admin -- --email owner@example.com');
  }

  const password = await prompt('Super admin password (minimum 12 characters): ');
  const confirmation = await prompt('Confirm password: ');
  if (password.length < 12) throw new Error('Password must be at least 12 characters.');
  if (password !== confirmation) throw new Error('Passwords do not match.');

  await mongoose.connect(process.env.MONGO_URI);
  const account = await User.findOne({ email });
  if (account && !account.isSuperAdmin && account.role !== 'superadmin') {
    throw new Error('That email belongs to a business account. Use a separate email reserved for the platform owner.');
  }

  const username = usernameOption || account?.username || email.split('@')[0];
  if (username.length < 2 || username.length > 40) throw new Error('Username must be between 2 and 40 characters.');
  const existingUsername = await User.findOne({ username, email: { $ne: email } });
  if (existingUsername) throw new Error('That username is already in use. Specify a different one with --username.');

  const passwordHash = await bcrypt.hash(password, 12);
  if (account) {
    account.username = username;
    account.password = passwordHash;
    account.role = 'superadmin';
    account.isAdmin = false;
    account.isSuperAdmin = true;
    await account.save();
    process.stdout.write(`Separate platform owner access enabled for ${email}; password updated.\n`);
  } else {
    await User.create({ username, email, password: passwordHash, role: 'superadmin', isAdmin: false, isSuperAdmin: true, subscriptionPlan: 'free', subscriptionStatus: 'free' });
    process.stdout.write(`Separate platform owner account created for ${email}.\n`);
  }
};

try {
  await run();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
