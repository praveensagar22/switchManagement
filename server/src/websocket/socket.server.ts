import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../config/env.js';

export class SocketServer {
  private static io: SocketIOServer | null = null;

  public static initialize(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
        credentials: true
      }
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      });
    });

    console.log('[WebSocket] Socket.IO server initialized.');
    return this.io;
  }

  public static getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO is not initialized yet. Call SocketServer.initialize() first.');
    }
    return this.io;
  }

  /**
   * Broadcast switch reachability change
   */
  public static emitSwitchStatus(switchId: string, status: string, details?: any): void {
    if (!this.io) return;
    this.io.emit('switch:status', { switchId, status, details, timestamp: new Date() });
  }

  /**
   * Broadcast port operational status change
   */
  public static emitPortStatus(data: {
    switchId: string;
    interfaceId: string;
    ifIndex: number;
    ifName?: string;
    ifOperStatus: string;
    previousOperStatus?: string;
    timestamp: Date;
  }): void {
    if (!this.io) return;
    this.io.emit('port:status', data);
  }

  /**
   * Broadcast new active alert
   */
  public static emitAlertNew(alert: any): void {
    if (!this.io) return;
    this.io.emit('alert:new', alert);
  }

  /**
   * Broadcast resolved alert
   */
  public static emitAlertResolved(alert: any): void {
    if (!this.io) return;
    this.io.emit('alert:resolved', alert);
  }
}
