const Settings = require('../models/settings.model');

// @desc    Get global system settings
// @route   GET /api/settings
// @access  Public (so login/signup logic can query it without auth)
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSystemSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

// @desc    Update global system settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res, next) => {
  try {
    // We only update fields that were passed in
    const updateKeys = ['allowRegistration', 'defaultAiModel', 'customSystemPrompt'];
    
    // Ensure the document exists
    await Settings.getSystemSettings();
    
    const updates = {};
    updateKeys.forEach(key => {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    });

    const updatedSettings = await Settings.findOneAndUpdate(
      { singleton: 'system' },
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'System settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
