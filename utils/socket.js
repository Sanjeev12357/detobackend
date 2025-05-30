const socketIO = require('socket.io');
const chat = require('../models/chat');

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinChat', ({ room, userId, firstName }) => {
      console.log(`${firstName} (${userId}) is joining room: ${room}`);
      socket.join(room);
      socket.to(room).emit('userJoined', { userId, firstName });
    });

    socket.on('sendMessage', async ({ room, message }) => {
  console.log(`Sending message to room: ${room}`, message);
  try {
    const newChat = new chat({
      room,
      sender: message.sender,
      text: message.text,
    });

    const savedMessage = await newChat.save();

    // Emit the saved message to everyone in the room
    io.to(room).emit('messageReceived', savedMessage);
  } catch (error) {
    console.error('Error saving message to DB:', error);
  }
});


    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = initializeSocket;
