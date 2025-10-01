import io from 'socket.io-client';

let socket = null;

export const initializeSocket = () => {
  if (socket) {
    socket.disconnect();
  }
  
  socket = io('http://localhost:5000', {
    transports: ['websocket'],
    upgrade: false
  });

  socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => socket;
