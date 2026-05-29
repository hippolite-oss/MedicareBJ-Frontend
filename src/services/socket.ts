/**
 * services/socket.ts — Connexion Socket.io
 */
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5001';

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    auth: { token },
    // ⚡ OPTIMISATION 1: Forcer WebSocket uniquement (plus rapide que polling)
    transports: ['websocket'],
    // ⚡ OPTIMISATION 2: Réduire les délais de reconnexion
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // ⚡ OPTIMISATION 3: Timeout plus court pour détecter les problèmes rapidement
    timeout: 10000,
    // ⚡ OPTIMISATION 4: Activer la compression pour réduire la latence
    forceNew: false,
    // ⚡ OPTIMISATION 5: Upgrade immédiat vers WebSocket
    upgrade: true,
    rememberUpgrade: true,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connecté :', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Erreur connexion :', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Déconnecté :', reason);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;
