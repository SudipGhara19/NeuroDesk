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
      const isRoomId = 
        recipientId.startsWith('team_') || 
        recipientId.startsWith('doc_') || 
        recipientId === 'global';

      if (isRoomId) {
        // It's a room ID — query by roomId field
        query = { roomId: recipientId };
      } else {
        // Direct messages between two users (private chat)
        query = {
          $or: [
            { senderId: userId, recipientId: recipientId },
            { senderId: recipientId, recipientId: userId }
          ]
        };
      }
    } else {
      // No param — return global room
      query = { roomType: 'global' };
    }

    const chats = await Chat.find(query)
      .sort({ timestamp: 1 })
      .limit(100)
      .populate('senderId', 'fullName email');

    res.json(chats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChatHistory
};
