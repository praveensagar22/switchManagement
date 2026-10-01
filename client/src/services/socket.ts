import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to monitoring server. Socket ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[WebSocket] Disconnected from monitoring server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
    });
  }
  return socket;
}

export function subscribeToPortStatus(
  callback: (data: {
    switchId: string;
    interfaceId: string;
    ifIndex: number;
    ifName?: string;
    ifOperStatus: string;
    previousOperStatus?: string;
    timestamp: string;
  }) => void
) {
  const s = getSocket();
  s.on('port:status', callback);
  return () => {
    s.off('port:status', callback);
  };
}

export function subscribeToSwitchStatus(
  callback: (data: { switchId: string; status: string; details?: any; timestamp: string }) => void
) {
  const s = getSocket();
  s.on('switch:status', callback);
  return () => {
    s.off('switch:status', callback);
  };
}

export function subscribeToAlerts(
  onNewAlert: (alert: any) => void,
  onResolvedAlert: (alert: any) => void
) {
  const s = getSocket();
  s.on('alert:new', onNewAlert);
  s.on('alert:resolved', onResolvedAlert);
  return () => {
    s.off('alert:new', onNewAlert);
    s.off('alert:resolved', onResolvedAlert);
  };
}
