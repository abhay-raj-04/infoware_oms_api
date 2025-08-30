import 'dotenv/config'; 
import app from './app.js'; 
import prisma from "./database/prisma.js"
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setIO } from './utils/socket.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    const httpServer = createServer(app);
    const io = new SocketIOServer(httpServer, { cors: { origin: '*'} });
    setIO(io);

    io.on('connection', (socket) => {
      socket.emit('connected', { ok: true });
    });

    httpServer.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database or start server:', error);
    process.exit(1);
  } finally {
    process.on('SIGINT', async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }
}

startServer();