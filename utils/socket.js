const socketIO = require('socket.io');

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

    socket.on('sendMessage', ({ room, message }) => {
      console.log(`Sending message to room: ${room}`, message);
      io.to(room).emit('messageReceived', message);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = initializeSocket;
