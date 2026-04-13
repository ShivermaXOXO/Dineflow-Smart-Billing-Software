// socket.js
const { Server } = require('socket.io');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173",
        "https://dineflow-smart-billing-software.vercel.app"],

      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true
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
