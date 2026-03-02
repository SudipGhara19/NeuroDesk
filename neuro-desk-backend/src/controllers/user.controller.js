const User = require('../models/user.model');
const UserData = require('../models/userData.model');
const bcrypt = require('bcryptjs');

// @desc    Get all users (Admin/Manager only)
// @route   GET /api/users
// @access  Private/Admin/Manager
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').lean();
    const userIds = users.map(u => u._id);
    const userDatas = await UserData.find({ userId: { $in: userIds } }).lean();

    const populatedUsers = users.map(user => {
      const data = userDatas.find(d => d.userId.toString() === user._id.toString());
      if (data) {
        return {
          ...user,
          phone: data.phone,
          address: data.address,
          department: data.department,
          bio: data.bio,
          stats: data.stats,
          presence: data.presence,
          analytics: data.analytics
        };
      }
      return user;
    });

    res.json(populatedUsers);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all team members (public basic info for chat)
// @route   GET /api/users/members
// @access  Private (all authenticated users)
const getTeamMembers = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: { $ne: false } }).select('_id fullName email role');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a Manager (Admin only)
// @route   POST /api/users/manager
// @access  Private/Admin
const createManager = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Manager User
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: 'Manager',
    });

    // Create associated UserData
    const userData = await UserData.create({
      userId: user._id,
      fullName: user.fullName,
      email: user.email
    });

    res.status(201).json({
      message: 'Manager created successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isAiRestricted: user.isAiRestricted
      },
      profile: userData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile (with UserData)
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const userData = await UserData.findOne({ userId: req.user.id });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const {fullName, department, bio, address, phone } = req.body;

    // Update User model
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.fullName = fullName || user.fullName;
    await user.save();

    // Update UserData model
    const userData = await UserData.findOneAndUpdate(
      { userId: req.user.id },
      {  
        fullName,
        department, 
        bio,
        address,
        phone
      },
      { returnDocument: 'after' }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      profile: userData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (Active/Inactive)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin/Manager
const updateUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
      res.status(403);
      throw new Error('Not authorized to update user status');
    }

    if (req.user.role === 'Manager' && user.role === 'Admin') {
      res.status(403);
      throw new Error('Managers cannot modify Admins');
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `User is now ${user.isActive ? 'active' : 'inactive'}`, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle AI Restriction
// @route   PATCH /api/users/:id/restrict-ai
// @access  Private/Admin/Manager
const updateAiRestriction = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
      res.status(403);
      throw new Error('Not authorized to update AI restrictions');
    }

    if (req.user.role === 'Manager' && user.role === 'Admin') {
      res.status(403);
      throw new Error('Managers cannot modify Admins');
    }

    user.isAiRestricted = !user.isAiRestricted;
    await user.save();

    res.json({ message: `User AI access is now ${user.isAiRestricted ? 'restricted' : 'allowed'}`, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin/Manager/User
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Role-based deletion logic
    if (req.user.role === 'User' && req.user.id !== user._id.toString()) {
      res.status(403);
      throw new Error('Users can only delete their own account');
    }
    
    if (req.user.role === 'Manager' && user.role === 'Admin') {
      res.status(403);
      throw new Error('Managers cannot delete Admins');
    }

    await User.findByIdAndDelete(req.params.id);
    await UserData.findOneAndDelete({ userId: req.params.id });

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getTeamMembers,
  createManager,
  getUserProfile,
  updateUserProfile,
  updateUserStatus,
  updateAiRestriction,
  deleteUser
};

