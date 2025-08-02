import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = createServer();
const wss = new WebSocketServer({ server });

// Enhanced in-memory storage
const rooms = new Map();
const users = new Map();
const messageHistory = new Map();
const privateMessages = new Map();
const userSessions = new Map();
const messageReactions = new Map();
const pinnedMessages = new Map();

// Initialize default rooms with descriptions
const defaultRooms = [
  { id: 'general', name: 'General', description: 'General discussion for everyone' },
  { id: 'random', name: 'Random', description: 'Random thoughts and conversations' },
  { id: 'tech-talk', name: 'Tech Talk', description: 'Technology discussions and help' },
  { id: 'announcements', name: 'Announcements', description: 'Important announcements' }
];

defaultRooms.forEach(room => {
  rooms.set(room.id, { 
    ...room, 
    users: new Set(), 
    createdAt: new Date().toISOString(),
    isPrivate: false 
  });
  messageHistory.set(room.id, []);
  pinnedMessages.set(room.id, []);
});

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

function broadcastToRoom(roomId, message, excludeUserId = null) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.users.forEach(userId => {
    if (userId !== excludeUserId) {
      const user = users.get(userId);
      if (user && user.ws.readyState === 1) {
        try {
          user.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error sending message to user:', error);
        }
      }
    }
  });
}

function broadcastToAllUsers(message, excludeUserId = null) {
  users.forEach((user, userId) => {
    if (userId !== excludeUserId && user.ws.readyState === 1) {
      try {
        user.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error broadcasting to user:', error);
      }
    }
  });
}

function broadcastUserList(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const userList = Array.from(room.users).map(userId => {
    const user = users.get(userId);
    return {
      id: userId,
      username: user?.username,
      status: user?.status || 'online',
      avatar: user?.avatar,
      lastSeen: user?.lastSeen
    };
  });

  broadcastToRoom(roomId, {
    type: 'user_list',
    users: userList,
    roomId
  });
}

function sendPrivateMessage(fromUserId, toUserId, content) {
  const fromUser = users.get(fromUserId);
  const toUser = users.get(toUserId);
  
  if (!fromUser || !toUser) return;

  const message = {
    id: generateId(),
    fromUserId,
    toUserId,
    fromUsername: fromUser.username,
    toUsername: toUser.username,
    content,
    timestamp: new Date().toISOString(),
    type: 'private_message',
    isRead: false
  };

  // Store private message
  const conversationId = [fromUserId, toUserId].sort().join('-');
  if (!privateMessages.has(conversationId)) {
    privateMessages.set(conversationId, []);
  }
  privateMessages.get(conversationId).push(message);

  // Send to both users
  [fromUser, toUser].forEach(user => {
    if (user.ws.readyState === 1) {
      try {
        user.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending private message:', error);
      }
    }
  });
}

wss.on('connection', (ws) => {
  let currentUser = null;
  console.log('New WebSocket connection established');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message.type, message);

      switch (message.type) {
        case 'join':
          const userId = message.userId || generateId();
          currentUser = {
            id: userId,
            username: message.username,
            ws: ws,
            currentRoom: message.roomId || 'general',
            status: 'online',
            avatar: message.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.username}`,
            joinedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
          };
          
          users.set(currentUser.id, currentUser);
          userSessions.set(ws, currentUser.id);
          
          // Add user to room
          const room = rooms.get(currentUser.currentRoom);
          if (room) {
            room.users.add(currentUser.id);
          }

          // Send initial data
          ws.send(JSON.stringify({
            type: 'connection_established',
            userId: currentUser.id,
            user: {
              id: currentUser.id,
              username: currentUser.username,
              avatar: currentUser.avatar
            }
          }));

          // Send room list
          ws.send(JSON.stringify({
            type: 'room_list',
            rooms: Array.from(rooms.entries()).map(([id, room]) => ({
              id,
              name: room.name,
              description: room.description,
              userCount: room.users.size,
              isPrivate: room.isPrivate
            }))
          }));

          // Send message history
          const history = messageHistory.get(currentUser.currentRoom) || [];
          ws.send(JSON.stringify({
            type: 'message_history',
            messages: history.slice(-100),
            roomId: currentUser.currentRoom
          }));

          // Send pinned messages
          const pinned = pinnedMessages.get(currentUser.currentRoom) || [];
          ws.send(JSON.stringify({
            type: 'pinned_messages',
            messages: pinned,
            roomId: currentUser.currentRoom
          }));

          // Broadcast user joined
          broadcastToRoom(currentUser.currentRoom, {
            type: 'user_joined',
            user: {
              id: currentUser.id,
              username: currentUser.username,
              avatar: currentUser.avatar
            },
            roomId: currentUser.currentRoom,
            timestamp: new Date().toISOString()
          }, currentUser.id);

          broadcastUserList(currentUser.currentRoom);
          console.log(`User ${currentUser.username} joined room ${currentUser.currentRoom}`);
          break;

        case 'message':
          if (!currentUser) {
            console.log('Message received but user not authenticated');
            return;
          }

          const chatMessage = {
            id: generateId(),
            userId: currentUser.id,
            username: currentUser.username,
            avatar: currentUser.avatar,
            content: message.content,
            roomId: message.roomId,
            timestamp: new Date().toISOString(),
            type: 'message',
            reactions: {},
            isEdited: false,
            replyTo: message.replyTo || null
          };

          console.log('Broadcasting message:', chatMessage);

          // Store message
          if (!messageHistory.has(message.roomId)) {
            messageHistory.set(message.roomId, []);
          }
          messageHistory.get(message.roomId).push(chatMessage);

          // Broadcast to room
          broadcastToRoom(message.roomId, chatMessage);
          break;

        case 'private_message':
          if (!currentUser) return;
          sendPrivateMessage(currentUser.id, message.toUserId, message.content);
          break;

        case 'typing':
          if (!currentUser) return;
          
          broadcastToRoom(message.roomId, {
            type: 'typing',
            userId: currentUser.id,
            username: currentUser.username,
            isTyping: message.isTyping,
            roomId: message.roomId
          }, currentUser.id);
          break;

        case 'switch_room':
          if (!currentUser) return;

          // Remove from current room
          const oldRoom = rooms.get(currentUser.currentRoom);
          if (oldRoom) {
            oldRoom.users.delete(currentUser.id);
            broadcastUserList(currentUser.currentRoom);
          }

          // Add to new room
          currentUser.currentRoom = message.roomId;
          const newRoom = rooms.get(message.roomId);
          if (newRoom) {
            newRoom.users.add(currentUser.id);
          }

          // Send message history for new room
          const newRoomHistory = messageHistory.get(message.roomId) || [];
          ws.send(JSON.stringify({
            type: 'message_history',
            messages: newRoomHistory.slice(-100),
            roomId: message.roomId
          }));

          // Send pinned messages for new room
          const newRoomPinned = pinnedMessages.get(message.roomId) || [];
          ws.send(JSON.stringify({
            type: 'pinned_messages',
            messages: newRoomPinned,
            roomId: message.roomId
          }));

          broadcastUserList(message.roomId);
          break;

        case 'create_room':
          if (!currentUser) return;

          const newRoomId = message.roomName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
          const newRoomData = {
            id: newRoomId,
            name: message.roomName,
            description: message.description || 'Custom room',
            users: new Set(),
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id,
            isPrivate: message.isPrivate || false
          };

          rooms.set(newRoomId, newRoomData);
          messageHistory.set(newRoomId, []);
          pinnedMessages.set(newRoomId, []);

          // Broadcast new room to all users
          broadcastToAllUsers({
            type: 'room_created',
            room: {
              id: newRoomId,
              name: message.roomName,
              description: newRoomData.description,
              userCount: 0,
              isPrivate: newRoomData.isPrivate
            },
            creator: currentUser.username
          });
          break;

        case 'react_to_message':
          if (!currentUser) return;

          const targetMessage = messageHistory.get(message.roomId)?.find(msg => msg.id === message.messageId);
          if (targetMessage) {
            if (!targetMessage.reactions) targetMessage.reactions = {};
            if (!targetMessage.reactions[message.emoji]) targetMessage.reactions[message.emoji] = [];
            
            const userIndex = targetMessage.reactions[message.emoji].indexOf(currentUser.id);
            if (userIndex === -1) {
              targetMessage.reactions[message.emoji].push(currentUser.id);
            } else {
              targetMessage.reactions[message.emoji].splice(userIndex, 1);
              if (targetMessage.reactions[message.emoji].length === 0) {
                delete targetMessage.reactions[message.emoji];
              }
            }

            broadcastToRoom(message.roomId, {
              type: 'message_reaction',
              messageId: message.messageId,
              reactions: targetMessage.reactions,
              roomId: message.roomId
            });
          }
          break;

        case 'pin_message':
          if (!currentUser) return;

          const messageToPin = messageHistory.get(message.roomId)?.find(msg => msg.id === message.messageId);
          if (messageToPin) {
            const pinnedList = pinnedMessages.get(message.roomId) || [];
            const isAlreadyPinned = pinnedList.some(msg => msg.id === message.messageId);
            
            if (!isAlreadyPinned) {
              pinnedList.push({ ...messageToPin, pinnedBy: currentUser.id, pinnedAt: new Date().toISOString() });
              pinnedMessages.set(message.roomId, pinnedList);

              broadcastToRoom(message.roomId, {
                type: 'message_pinned',
                message: messageToPin,
                pinnedBy: currentUser.username,
                roomId: message.roomId
              });
            }
          }
          break;

        case 'delete_message':
          if (!currentUser) return;

          const roomMessages = messageHistory.get(message.roomId) || [];
          const messageIndex = roomMessages.findIndex(msg => msg.id === message.messageId && msg.userId === currentUser.id);
          
          if (messageIndex !== -1) {
            roomMessages[messageIndex].content = '[Message deleted]';
            roomMessages[messageIndex].isDeleted = true;
            roomMessages[messageIndex].deletedAt = new Date().toISOString();

            broadcastToRoom(message.roomId, {
              type: 'message_deleted',
              messageId: message.messageId,
              roomId: message.roomId
            });
          }
          break;

        case 'edit_message':
          if (!currentUser) return;

          const roomMsgs = messageHistory.get(message.roomId) || [];
          const msgIndex = roomMsgs.findIndex(msg => msg.id === message.messageId && msg.userId === currentUser.id);
          
          if (msgIndex !== -1) {
            roomMsgs[msgIndex].content = message.newContent;
            roomMsgs[msgIndex].isEdited = true;
            roomMsgs[msgIndex].editedAt = new Date().toISOString();

            broadcastToRoom(message.roomId, {
              type: 'message_edited',
              messageId: message.messageId,
              newContent: message.newContent,
              roomId: message.roomId
            });
          }
          break;

        case 'update_status':
          if (!currentUser) return;
          
          currentUser.status = message.status;
          currentUser.lastSeen = new Date().toISOString();
          
          // Broadcast status update to all rooms user is in
          rooms.forEach((room, roomId) => {
            if (room.users.has(currentUser.id)) {
              broadcastUserList(roomId);
            }
          });
          break;

        case 'get_online_users':
          if (!currentUser) return;
          
          const onlineUsers = Array.from(users.values()).map(user => ({
            id: user.id,
            username: user.username,
            status: user.status,
            avatar: user.avatar,
            lastSeen: user.lastSeen
          }));

          ws.send(JSON.stringify({
            type: 'online_users',
            users: onlineUsers
          }));
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    if (currentUser) {
      // Remove from all rooms
      rooms.forEach((room, roomId) => {
        if (room.users.has(currentUser.id)) {
          room.users.delete(currentUser.id);
          broadcastUserList(roomId);
        }
      });

      // Update user status
      currentUser.status = 'offline';
      currentUser.lastSeen = new Date().toISOString();

      // Broadcast user left
      broadcastToAllUsers({
        type: 'user_left',
        user: {
          id: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar
        },
        timestamp: new Date().toISOString()
      });

      users.delete(currentUser.id);
      userSessions.delete(ws);
      console.log(`User ${currentUser.username} disconnected`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Enhanced WebSocket server running on port ${PORT}`);
  console.log('Features: Real-time messaging, Private messages, Reactions, File sharing, Message editing');
});