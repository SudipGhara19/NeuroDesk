const jwt = require('jsonwebtoken');
const UserData = require('../models/userData.model');
const Chat = require('../models/chat.model');

module.exports = (io) => {
// ... existing auth logic ...
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
// ... existing connection logic ...
    const userId = socket.user.id;
    console.log(`User connected: ${userId} (${socket.id})`);

    // Update user status to online
    try {
      await UserData.findOneAndUpdate(
        { userId },
        { 
          'presence.isOnline': true,
          'presence.lastSeen': new Date(),
          $push: {
            'analytics.sessionHistory': {
              startTime: new Date()
            }
          }
        }
      );
      
      // Broadcast presence update
      socket.broadcast.emit('presence:update', { userId, isOnline: true });
    } catch (err) {
      console.error('Error updating presence on connect:', err);
    }

    // Join user-specific room
    socket.join(userId);

    socket.on('disconnect', async () => {
// ... existing disconnect logic ...
      console.log(`User disconnected: ${userId} (${socket.id})`);

      try {
        const userData = await UserData.findOne({ userId });
        if (userData && userData.analytics.sessionHistory.length > 0) {
          const lastSession = userData.analytics.sessionHistory[userData.analytics.sessionHistory.length - 1];
          if (!lastSession.endTime) {
            lastSession.endTime = new Date();
            lastSession.durationMs = lastSession.endTime - lastSession.startTime;
            await userData.save();
          }
        }

        await UserData.findOneAndUpdate(
          { userId },
          { 
            'presence.isOnline': false,
            'presence.lastSeen': new Date()
          }
        );

        // Broadcast presence update
        socket.broadcast.emit('presence:update', { userId, isOnline: false });
      } catch (err) {
        console.error('Error updating presence on disconnect:', err);
      }
    });

    // Chat event
    socket.on('chat:message', async (data) => {
      const { recipientId, message } = data;
      
      try {
        // Save chat to database
        const newChat = await Chat.create({
          senderId: userId,
          recipientId: recipientId || null,
          message,
          timestamp: new Date()
        });

        const messageData = {
          _id: newChat._id,
          senderId: userId,
          message,
          timestamp: newChat.timestamp
        };

        if (recipientId) {
          io.to(recipientId).emit('chat:message', messageData);
        } else {
          // Broadcast to all (e.g., global room)
          io.emit('chat:message', messageData);
        }
      } catch (err) {
        console.error('Error saving chat message:', err);
      }
    });
  });
};
