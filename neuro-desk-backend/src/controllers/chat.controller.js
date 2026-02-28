const Chat = require('../models/chat.model');

// @desc    Get chat history between current user and another user (or global)
// @route   GET /api/chats/:recipientId?
// @access  Private
const getChatHistory = async (req, res, next) => {
  const { recipientId } = req.params;
  const userId = req.user.id;

  try {
    let query;
    if (recipientId) {
      // Direct messages between two users
      query = {
        $or: [
          { senderId: userId, recipientId: recipientId },
          { senderId: recipientId, recipientId: userId }
        ]
      };
    } else {
      // Global chat (where recipientId is null)
      query = { recipientId: null };
    }

    const chats = await Chat.find(query)
      .sort({ createdAt: 1 }) // Order by time (oldest first)
      .limit(100); // Limit for performance

    res.json(chats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChatHistory
};
