const User = require('../models/user.model');
const UserData = require('../models/userData.model');
const Settings = require('../models/settings.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email.service');

// Generate short-lived Access Token (15m)
const generateAccessToken = (id, email, role) => {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

// Generate long-lived Refresh Token (7d)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Helper: Attach HTTP-Only cookie
const attachRefreshCookie = (res, token) => {
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Allows cross-origin in prod
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res, next) => {
  const { fullName, email, password, role } = req.body;

  try {
    // 1. Check if registration is allowed by Admin
    const settings = await Settings.getSystemSettings();
    if (!settings.allowRegistration) {
      res.status(403);
      throw new Error('User registration is currently disabled by the administrator.');
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'User',
    });

    if (user) {
      // Create associated UserData
      await UserData.create({
        userId: user._id,
        fullName: user.fullName,
        email: user.email
      });

      // Set user to online and update last active
      const userData = await UserData.findOneAndUpdate(
        { userId: user._id },
        { 
          'presence.isOnline': true,
          'presence.lastSeen': new Date(),
          'stats.lastActive': new Date()
        },
        { returnDocument: 'after' }
      );

      // Issue dual tokens
      const accessToken = generateAccessToken(user._id, user.email, user.role);
      const refreshToken = generateRefreshToken(user._id);

      // Set Refresh string invisibly and securely via Cookie
      attachRefreshCookie(res, refreshToken);

      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        userData: userData,
        token: accessToken, // Frontend only sees short-lived access token
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Check if user is active
      if (!user.isActive) {
        res.status(401);
        throw new Error('This account has been deactivated. Please contact an admin.');
      }

      // Set user to online and update last active
      const userData = await UserData.findOneAndUpdate(
        { userId: user._id },
        { 
          'presence.isOnline': true,
          'presence.lastSeen': new Date(),
          'stats.lastActive': new Date()
        },
        { returnDocument: 'after' } // Return the updated document
      );

      // Issue dual tokens
      const accessToken = generateAccessToken(user._id, user.email, user.role);
      const refreshToken = generateRefreshToken(user._id);

      // Set Refresh string invisibly and securely via Cookie
      attachRefreshCookie(res, refreshToken);

      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        userData: userData,
        token: accessToken, // Frontend only sees short-lived access token
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - Send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('There is no user with that email');
    }

    // Generate reset token (JWT, valid for 30m)
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30m',
    });

    // Reset URL
    const resetUrl = `https://neuro-desk-steel.vercel.app/auth?tab=resetPassword&token=${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click on the link below to reset your password: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'NeuroDesk Password Reset',
        message,
        html: `<p>You requested a password reset. Click the button below to reset it. This link is valid for 30 minutes.</p>
               <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>`,
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      console.error(err);
      res.status(500);
      throw new Error('Email could not be sent');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    if (!token) {
      res.status(400);
      throw new Error('Invalid or missing token');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.status(401);
      return next(new Error('Reset token has expired'));
    }
    next(error);
  }
};

// @desc    Logout user & set offline
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    await UserData.findOneAndUpdate(
      { userId: req.user.id },
      { 
        'presence.isOnline': false,
        'presence.lastSeen': new Date()
      }
    );

    // Destroy the refresh cookie on logout
    res.clearCookie('jwt', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh Access Token
// @route   GET /api/auth/refresh
// @access  Public (Relies on httpOnly cookie)
const refreshToken = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    
    if (!cookies?.jwt) {
      res.status(401);
      throw new Error('Unauthorized - No refresh cookie attached');
    }

    const currentRefreshToken = cookies.jwt;

    // Verify the JWT string
    jwt.verify(currentRefreshToken, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        res.status(403);
        return next(new Error('Forbidden - Refresh token expired or invalid'));
      }

      // Fetch user to re-encode the access token with the latest role definitions
      const user = await User.findById(decoded.id);

      if (!user) {
        res.status(401);
        return next(new Error('Unauthorized - User no longer exists'));
      }

      // Issue fresh access token (15m)
      const accessToken = generateAccessToken(user._id, user.email, user.role);
      
      res.json({ token: accessToken });
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken
};
