const User = require('../models/user.model');
const UserData = require('../models/userData.model');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
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
      user,
      profile: userData
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
    const { fullName, profilePicture, department, bio, theme } = req.body;

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
        fullName: fullName || user.fullName,
        profilePicture, 
        department, 
        bio,
        'preferences.theme': theme
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

module.exports = {
  getUsers,
  getUserProfile,
  updateUserProfile
};
