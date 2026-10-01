import snmp from 'net-snmp';
import { config } from '../config/env.js';
import { TrapParser } from './trap.parser.js';
import { EventService } from '../services/event.service.js';

export class TrapReceiver {
  private static receiverInstance: any = null;
  private static isListening: boolean = false;
  private static lastError: string | null = null;
  private static trapCount: number = 0;

  public static start(): void {
    if (this.isListening) {
      console.log('[TrapReceiver] Receiver is already running.');
      return;
    }

    const port = config.snmpTrapPort;

    const options = {
      port,
      disableAuthorization: true,
      includeAuthentication: true
    };

    try {
      this.receiverInstance = snmp.createReceiver(options, async (error: any, notification: any) => {
        if (error) {
          console.error('[TrapReceiver] Error in incoming trap callback:', error.message || error);
          this.lastError = error.message || String(error);
          return;
        }

        this.trapCount++;
        try {
          const parsed = TrapParser.parse(notification);
          if (parsed) {
            console.log(
              `[TrapReceiver] Received Trap #${this.trapCount} from ${parsed.sourceIp} (OID: ${parsed.trapOid})`
            );
            // Hand over to EventService for correlation and persistence
            await EventService.handleIncomingTrap(parsed);
          }
        } catch (err: any) {
          console.error('[TrapReceiver] Failed to process trap:', err.message || err);
        }
      });

      this.isListening = true;
      this.lastError = null;
      console.log(`[TrapReceiver] SNMP Trap daemon listening on UDP port ${port}`);
    } catch (err: any) {
      this.isListening = false;
      this.lastError = err.message || String(err);
      console.error(
        `[TrapReceiver] CRITICAL: Could not bind SNMP Trap Receiver to port ${port}:`,
        err.message || err
      );
      if (err.code === 'EACCES') {
        console.warn(
          `[TrapReceiver] NOTE: Binding to port ${port} requires administrator/root privileges or setcap on Linux. You can set SNMP_TRAP_PORT=1162 in .env for development testing.`
        );
      }
    }
  }

  public static stop(): void {
    if (this.receiverInstance && typeof this.receiverInstance.close === 'function') {
      try {
        this.receiverInstance.close();
      } catch (e) {
        // ignore
      }
    }
    this.isListening = false;
    this.receiverInstance = null;
    console.log('[TrapReceiver] Stopped SNMP Trap Receiver.');
  }

  public static getStatus() {
    return {
      isListening: this.isListening,
      port: config.snmpTrapPort,
      trapCount: this.trapCount,
      lastError: this.lastError
    };
  }
}
