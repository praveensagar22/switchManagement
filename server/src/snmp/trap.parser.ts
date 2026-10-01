import { NormalizedTrapPayload, TrapVarbind } from '../core/types/event.types.js';
import { STANDARD_OIDS } from './mibs/oids.standard.js';

export class TrapParser {
  /**
   * Parses raw notification object from net-snmp createReceiver into NormalizedTrapPayload
   */
  public static parse(notification: any): NormalizedTrapPayload | null {
    if (!notification || !notification.pdu) {
      return null;
    }

    const { pdu, rinfo } = notification;
    const sourceIp = rinfo?.address || '0.0.0.0';
    const rawVarbinds = pdu.varbinds || [];

    const varbinds: TrapVarbind[] = rawVarbinds.map((vb: any) => {
      let value = vb.value;
      if (Buffer.isBuffer(value)) {
        // Try decoding as utf8 if printable, else keep hex or string
        const str = value.toString('utf8');
        const isPrintable = /^[\x20-\x7E\r\n\t]*$/.test(str);
        value = isPrintable ? str : value.toString('hex');
      }
      return {
        oid: String(vb.oid),
        type: vb.type,
        value
      };
    });

    let trapOid = '';
    const genericTrap = pdu.genericTrap;
    const specificTrap = pdu.specificTrap;

    // 1. Look for SNMPv2 / v3 snmpTrapOID (1.3.6.1.6.3.1.1.4.1.0)
    const trapOidVb = varbinds.find((vb) => vb.oid === STANDARD_OIDS.SNMP_TRAP_OID);
    if (trapOidVb && trapOidVb.value) {
      trapOid = String(trapOidVb.value);
    } else if (genericTrap !== undefined) {
      // 2. SNMPv1 Generic Trap mapping
      switch (genericTrap) {
        case 0:
          trapOid = STANDARD_OIDS.COLD_START_TRAP;
          break;
        case 1:
          trapOid = STANDARD_OIDS.WARM_START_TRAP;
          break;
        case 2:
          trapOid = STANDARD_OIDS.LINK_DOWN_TRAP;
          break;
        case 3:
          trapOid = STANDARD_OIDS.LINK_UP_TRAP;
          break;
        default:
          trapOid = pdu.enterprise ? `${pdu.enterprise}.${specificTrap || 0}` : `1.3.6.1.6.3.1.1.5.${genericTrap}`;
          break;
      }
    }

    return {
      sourceIp,
      trapOid,
      genericTrap,
      specificTrap,
      varbinds,
      timestamp: new Date()
    };
  }
}
