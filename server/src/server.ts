import http from 'http';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { SocketServer } from './websocket/socket.server.js';
import { TrapReceiver } from './snmp/trap.receiver.js';
import { PollingWorker } from './services/polling.worker.js';

async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log(' Network Switch Monitoring & Management Backend');
  console.log('----------------------------------------------------');

  // 1. Connect to MongoDB
  await connectDatabase();

  // 1b. Ensure default admin user exists
  const { UserModel } = await import('./models/User.model.js');
  const { hashPassword } = await import('./security/password.js');
  const userCount = await UserModel.countDocuments();
  if (userCount === 0) {
    const passwordHash = await hashPassword('Admin@123456');
    await UserModel.create({
      email: 'admin@network.local',
      passwordHash,
      fullName: 'System Administrator',
      role: 'ADMIN',
      isActive: true
    });
    console.log('[Auth] Initialized default admin: admin@network.local / Admin@123456');
  }

  // 2. Initialize Express application & HTTP server
  const app = createApp();
  const httpServer = http.createServer(app);

  // 3. Initialize WebSocket gateway
  SocketServer.initialize(httpServer);

  // 4. Start SNMP Trap Receiver Daemon (UDP port 162)
  TrapReceiver.start();

  // 5. Start Background Polling Worker
  PollingWorker.start();

  // 6. Start HTTP API listener
  const PORT = config.port;
  httpServer.listen(PORT, () => {
    console.log(`[HTTP Server] REST API listening on port ${PORT}`);
    console.log(`[HTTP Server] API Base: http://localhost:${PORT}/api/v1`);
    console.log(`[System] Trap Receiver Port: UDP ${config.snmpTrapPort}`);
    console.log('----------------------------------------------------');
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n[System] Received ${signal}. Initiating graceful shutdown...`);
    PollingWorker.stop();
    TrapReceiver.stop();

    httpServer.close(() => {
      console.log('[HTTP Server] Stopped listening for connections.');
    });

    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[Fatal Bootstrap Error]:', err);
  process.exit(1);
});
