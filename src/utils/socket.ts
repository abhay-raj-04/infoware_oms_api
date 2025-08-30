import type { Server } from 'socket.io';

let io: Server | undefined;

export function setIO(instance: Server) {
  io = instance;
}

export function getIO(): Server | undefined {
  return io;
}
