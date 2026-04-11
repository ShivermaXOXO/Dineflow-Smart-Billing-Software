// socket.js
const { Server } = require('socket.io');
const socketIO = require('socket.io');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    },
  });

  global.io = io;

  io.on('connection', (socket) => {
    socket.on('joinHotelRoom', (hotelId) => {
      socket.join(`hotel-${hotelId}`);
    });
    socket.on("saveOrder", ({ hotelId, orders, kots, takeaway }) => {
      socket.to(`hotel-${hotelId}`).emit(`remoteOrder`, { orders, kots, takeaway });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
}

module.exports = initSocket;
