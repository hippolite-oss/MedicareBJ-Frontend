/**
 * hooks/useSocket.ts — Hook Socket.io lié à l'auth
 */
import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

export const useSocket = (): Socket | null => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        socketRef.current = connectSocket(token);
      }
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user?.id]);

  return socketRef.current;
};
