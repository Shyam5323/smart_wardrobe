const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const SALT_ROUNDS = 10;
const DEFAULT_TOKEN_EXPIRY = '7d';

const sanitizeUser = (userDoc) => {
  const user = userDoc.toObject({ versionKey: false });
  delete user.passwordHash;
  return user;
};

const createToken = (userId) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('Missing JWT secret. Set the JWT_SECRET environment variable.');
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_TOKEN_EXPIRY,
  });
};

exports.signup = async (req, res, next) => {
  try {
    const {
      email,
      password,
      displayName,
      profilePicture,
      location,
      preferences,
    } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      displayName: displayName ? displayName.trim() : undefined,
      profilePicture,
      location,
      preferences,
      joinedAt: new Date(),
      lastActive: new Date(),
    });

    const token = createToken(user._id);

    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    user.lastActive = new Date();
    await user.save();

    const token = createToken(user._id);

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.lastActive = new Date();
    await user.save();

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};
