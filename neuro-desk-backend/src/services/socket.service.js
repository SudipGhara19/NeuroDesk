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
      
      // Broadcast presence update to everyone else
      socket.broadcast.emit('presence:update', { userId, isOnline: true });

      // Send the currently online users list to the newly connected socket
      // We derive this from other sockets' user data
      try {
        const onlineSockets = await io.fetchSockets();
        const onlineUserIds = [...new Set(
          onlineSockets.map((s) => s.user?.id).filter(Boolean)
        )];
        socket.emit('presence:list', onlineUserIds);
      } catch (err) {
        console.error('Error fetching online sockets:', err);
      }
    } catch (err) {
      console.error('Error updating presence on connect:', err);
    }

    // Join user-specific room AND the global team room automatically
    socket.join(userId);
    socket.join('team_general');
    console.log(`User ${userId} auto-joined team_general`);

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

    // Room Connection Events
    socket.on('room:join', (roomId) => {
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
    });

    socket.on('room:leave', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${userId} left room ${roomId}`);
    });

    // Chat Event (Supports Private and Room/Global Chats)
    socket.on('chat:message', async (data) => {
      const { recipientId, roomId, message, roomType } = data;
      
      try {
        // Determine roomType if not provided
        // If recipientId → private; if roomId → team/doc; else → global
        const resolvedRoomType = roomType || (recipientId ? 'private' : (roomId ? 'team' : 'global'));
        const resolvedRoomId   = roomId || (resolvedRoomType === 'global' ? 'global' : null);

        // Save to database
        const newChat = await Chat.create({
          senderId: userId,
          recipientId: recipientId || null,
          roomId: resolvedRoomId,
          roomType: resolvedRoomType,
          message,
          timestamp: new Date()
        });

        const messageData = {
          _id: newChat._id.toString(),
          senderId: userId,
          roomId: resolvedRoomId,
          recipientId: recipientId || null,
          roomType: resolvedRoomType,
          message,
          timestamp: newChat.timestamp
        };

        if (recipientId) {
          // Private DM: only sender + recipient
          io.to(recipientId).emit('chat:message', messageData);
          socket.emit('chat:message', messageData);
        } else if (resolvedRoomId && resolvedRoomId !== 'global') {
          // Named room (e.g. team_general): emit to room only
          io.to(resolvedRoomId).emit('chat:message', messageData);
        } else {
          // Fallback: broadcast to all
          io.emit('chat:message', messageData);
        }
      } catch (err) {
        console.error('Error saving chat message:', err);
      }
    });

    // Fetch Chat History
    socket.on('chat:history', async (data, callback) => {
      const { recipientId, isGlobal, limit = 50, skip = 0 } = data;
      
      try {
        let query = {};
        
        if (isGlobal) {
          query = { roomType: 'global' };
        } else if (recipientId) {
          query = {
            $or: [
              { senderId: userId, recipientId },
              { senderId: recipientId, recipientId: userId }
            ]
          };
        } else {
           return callback({ error: "Must specify a recipientId or isGlobal" });
        }

        const history = await Chat.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .populate('senderId', 'fullName email') // Populate sender info
          .lean();

        // Return chronological order
        callback({ success: true, data: history.reverse() });
      } catch (err) {
        console.error('Error fetching chat history:', err);
        callback({ error: 'Failed to fetch history' });
      }
    });
  });
};
