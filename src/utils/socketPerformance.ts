/**
 * Utilitaires pour mesurer les performances Socket.IO
 */
import { Socket } from 'socket.io-client';

interface PerformanceMetrics {
  latency: number;
  transport: string;
  connected: boolean;
  reconnectAttempts: number;
}

/**
 * Mesure la latence du socket
 */
export const measureSocketLatency = (socket: Socket): Promise<number> => {
  return new Promise((resolve) => {
    const start = Date.now();
    socket.emit('ping', () => {
      const latency = Date.now() - start;
      resolve(latency);
    });
    
    // Timeout après 5 secondes
    setTimeout(() => resolve(-1), 5000);
  });
};

/**
 * Obtient les métriques de performance du socket
 */
export const getSocketMetrics = async (socket: Socket | null): Promise<PerformanceMetrics | null> => {
  if (!socket) return null;
  
  const latency = await measureSocketLatency(socket);
  
  return {
    latency,
    transport: socket.io.engine.transport.name,
    connected: socket.connected,
    reconnectAttempts: socket.io.engine.transport.name === 'websocket' ? 0 : 1,
  };
};

/**
 * Affiche les métriques dans la console
 */
export const logSocketMetrics = async (socket: Socket | null): Promise<void> => {
  const metrics = await getSocketMetrics(socket);
  
  if (!metrics) {
    console.warn('❌ Socket non disponible');
    return;
  }
  
  console.group('📊 Socket.IO Performance');
  console.log(`🔌 Connecté: ${metrics.connected ? '✅' : '❌'}`);
  console.log(`🚀 Transport: ${metrics.transport}`);
  console.log(`⚡ Latence: ${metrics.latency}ms`);
  
  if (metrics.latency < 100) {
    console.log('✅ Excellente performance');
  } else if (metrics.latency < 300) {
    console.log('⚠️ Performance acceptable');
  } else {
    console.log('❌ Performance faible - vérifier la connexion');
  }
  
  if (metrics.transport !== 'websocket') {
    console.warn('⚠️ WebSocket non utilisé - performance réduite');
  }
  
  console.groupEnd();
};

/**
 * Monitore la latence en continu
 */
export const startLatencyMonitoring = (
  socket: Socket | null,
  interval: number = 10000
): (() => void) => {
  if (!socket) return () => {};
  
  const intervalId = setInterval(async () => {
    const latency = await measureSocketLatency(socket);
    
    if (latency > 500) {
      console.warn(`⚠️ Latence élevée: ${latency}ms`);
    }
  }, interval);
  
  return () => clearInterval(intervalId);
};

/**
 * Teste la vitesse de réception des notifications
 */
export const testNotificationSpeed = (socket: Socket): Promise<number> => {
  return new Promise((resolve) => {
    const start = Date.now();
    
    const handler = () => {
      const duration = Date.now() - start;
      socket.off('test_notification', handler);
      resolve(duration);
    };
    
    socket.on('test_notification', handler);
    socket.emit('request_test_notification');
    
    // Timeout après 10 secondes
    setTimeout(() => {
      socket.off('test_notification', handler);
      resolve(-1);
    }, 10000);
  });
};

/**
 * Hook React pour afficher les métriques au montage
 */
export const useSocketPerformanceLogger = (socket: Socket | null, enabled: boolean = false) => {
  if (!enabled || !socket) return;
  
  // Log initial
  setTimeout(() => {
    logSocketMetrics(socket);
  }, 2000);
  
  // Monitoring continu en dev
  if (process.env.NODE_ENV === 'development') {
    return startLatencyMonitoring(socket, 30000);
  }
};
