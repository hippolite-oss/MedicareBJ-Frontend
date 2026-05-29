/**
 * Panneau de debug pour Socket.IO (à utiliser en développement)
 */
import { useState, useEffect } from 'react';
import { getSocket } from '@/services/socket';
import { measureSocketLatency } from '@/utils/socketPerformance';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const SocketDebugPanel = () => {
  const [metrics, setMetrics] = useState({
    connected: false,
    transport: 'unknown',
    latency: 0,
    lastUpdate: new Date(),
  });
  const [isVisible, setIsVisible] = useState(false);

  const updateMetrics = async () => {
    const socket = getSocket();
    if (!socket) return;

    const latency = await measureSocketLatency(socket);
    
    setMetrics({
      connected: socket.connected,
      transport: socket.io.engine.transport.name,
      latency,
      lastUpdate: new Date(),
    });
  };

  useEffect(() => {
    // Mise à jour initiale
    updateMetrics();

    // Mise à jour toutes les 5 secondes
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  // Raccourci clavier pour afficher/masquer (Ctrl+Shift+S)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-gray-800 p-2 text-white shadow-lg hover:bg-gray-700"
        title="Afficher les métriques Socket.IO (Ctrl+Shift+S)"
      >
        📊
      </button>
    );
  }

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'bg-green-500';
    if (latency < 300) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLatencyLabel = (latency: number) => {
    if (latency < 100) return 'Excellent';
    if (latency < 300) return 'Acceptable';
    return 'Lent';
  };

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">Socket.IO Debug</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 p-0"
        >
          ✕
        </Button>
      </div>

      <div className="space-y-3 text-xs">
        {/* Statut de connexion */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Connexion:</span>
          <Badge variant={metrics.connected ? 'default' : 'destructive'}>
            {metrics.connected ? '✅ Connecté' : '❌ Déconnecté'}
          </Badge>
        </div>

        {/* Transport */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Transport:</span>
          <Badge variant={metrics.transport === 'websocket' ? 'default' : 'secondary'}>
            {metrics.transport}
          </Badge>
        </div>

        {/* Latence */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Latence:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">{metrics.latency}ms</span>
            <div className={`h-2 w-2 rounded-full ${getLatencyColor(metrics.latency)}`} />
          </div>
        </div>

        {/* Qualité */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Qualité:</span>
          <span className="font-semibold">{getLatencyLabel(metrics.latency)}</span>
        </div>

        {/* Dernière mise à jour */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Dernière mise à jour:</span>
          <span>{metrics.lastUpdate.toLocaleTimeString()}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={updateMetrics}
            className="flex-1 text-xs"
          >
            🔄 Rafraîchir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const socket = getSocket();
              if (socket) {
                console.group('📊 Socket.IO Détails');
                console.log('Socket ID:', socket.id);
                console.log('Connected:', socket.connected);
                console.log('Transport:', socket.io.engine.transport.name);
                console.log('URL:', socket.io.uri);
                console.groupEnd();
              }
            }}
            className="flex-1 text-xs"
          >
            📋 Logs
          </Button>
        </div>

        {/* Avertissements */}
        {metrics.transport !== 'websocket' && (
          <div className="rounded bg-yellow-500/10 p-2 text-[10px] text-yellow-600">
            ⚠️ WebSocket non utilisé. Performance réduite.
          </div>
        )}

        {metrics.latency > 500 && (
          <div className="rounded bg-red-500/10 p-2 text-[10px] text-red-600">
            ⚠️ Latence élevée. Vérifier la connexion réseau.
          </div>
        )}
      </div>

      <div className="mt-3 border-t pt-2 text-[10px] text-muted-foreground">
        Raccourci: <kbd className="rounded bg-muted px-1">Ctrl+Shift+S</kbd>
      </div>
    </Card>
  );
};
