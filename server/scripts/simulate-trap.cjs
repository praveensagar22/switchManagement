/**
 * Network Switch SNMP Trap Simulator
 * 
 * Simulates a switch sending standard linkDown (OID: 1.3.6.1.6.3.1.1.5.3) 
 * or linkUp (OID: 1.3.6.1.6.3.1.1.5.4) traps to the management server.
 * 
 * Usage:
 *   node scripts/simulate-trap.js [linkDown|linkUp] [ifIndex] [port]
 * Example:
 *   node scripts/simulate-trap.js linkDown 1 162
 *   node scripts/simulate-trap.js linkUp 1 162
 */

const snmp = require('net-snmp');

const action = process.argv[2] || 'linkDown';
const ifIndex = parseInt(process.argv[3] || '1', 10);
const trapPort = parseInt(process.argv[4] || '162', 10);
const targetHost = '127.0.0.1';

const isDown = action.toLowerCase() === 'linkdown';
const trapOid = isDown ? '1.3.6.1.6.3.1.1.5.3' : '1.3.6.1.6.3.1.1.5.4';
const newOperStatus = isDown ? 2 : 1; // 2=DOWN, 1=UP

console.log(`[Simulator] Preparing ${action} trap for ifIndex ${ifIndex}...`);
console.log(`[Simulator] Target: ${targetHost}:${trapPort}`);

const session = snmp.createSession(targetHost, 'public', {
  port: trapPort,
  version: snmp.Version2c
});

const varbinds = [
  {
    oid: '1.3.6.1.6.3.1.1.4.1.0', // snmpTrapOID
    type: snmp.ObjectType.OID,
    value: trapOid
  },
  {
    oid: `1.3.6.1.2.1.2.2.1.1.${ifIndex}`, // ifIndex
    type: snmp.ObjectType.Integer,
    value: ifIndex
  },
  {
    oid: `1.3.6.1.2.1.2.2.1.7.${ifIndex}`, // ifAdminStatus
    type: snmp.ObjectType.Integer,
    value: 1 // Admin UP
  },
  {
    oid: `1.3.6.1.2.1.2.2.1.8.${ifIndex}`, // ifOperStatus
    type: snmp.ObjectType.Integer,
    value: newOperStatus
  }
];

session.trap(trapOid, varbinds, (error) => {
  if (error) {
    console.error('[Simulator] Failed to send trap:', error.message || error);
  } else {
    console.log(`[Simulator] Successfully dispatched ${action} trap for port ${ifIndex}!`);
  }
  session.close();
});
