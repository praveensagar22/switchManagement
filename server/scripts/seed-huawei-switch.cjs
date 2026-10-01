/**
 * Seeds a target Huawei S5720 Switch with 28 physical interfaces
 * for local testing and trap simulation against 127.0.0.1.
 */

const mongoose = require('mongoose');

async function seedHuawei() {
  await mongoose.connect('mongodb://localhost:27017/switch_management');
  console.log('[Seed] Connected to MongoDB');

  const db = mongoose.connection;
  const switchesColl = db.collection('switches');
  const interfacesColl = db.collection('interfaces');

  // Check if already seeded
  const existing = await switchesColl.findOne({ ipAddress: '127.0.0.1' });
  let switchId;

  if (existing) {
    switchId = existing._id;
    console.log('[Seed] Target Huawei Switch already exists with ID:', switchId);
  } else {
    const newSwitch = await switchesColl.insertOne({
      name: 'Huawei-S5720-28P-LI-AC',
      hostname: 'HUAWEI-CORE-SW01',
      ipAddress: '127.0.0.1',
      vendor: 'HUAWEI',
      model: 'Huawei S5720-28P-PWR-LI-AC',
      serialNumber: '2102350J0B10H1000001',
      firmwareVersion: 'VRP (R) Software, Version 5.170 (S5720 V200R011C10SPC600)',
      location: 'Primary Data Center, Rack A-04',
      uptimeSeconds: 864200,
      connectionStatus: 'ONLINE',
      snmpConfig: {
        version: 'v2c',
        port: 161,
        communityEncrypted: '',
        timeout: 3000,
        retries: 2
      },
      lastSuccessfulPoll: new Date(),
      lastSeenTrap: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    switchId = newSwitch.insertedId;
    console.log('[Seed] Created Huawei S5720 switch with ID:', switchId);
  }

  // Create 24 Gigabit Ethernet copper ports + 4 SFP+ 10G uplink ports
  const count = await interfacesColl.countDocuments({ switchId });
  if (count === 0) {
    const ports = [];

    // 24 RJ45 1Gbps ports
    for (let i = 1; i <= 24; i++) {
      ports.push({
        switchId,
        ifIndex: i,
        ifName: `GigabitEthernet0/0/${i}`,
        ifDescr: `Huawei GigabitEthernet0/0/${i} Interface`,
        ifAlias: i <= 8 ? `Workstation LAN Port ${i}` : i === 24 ? 'Router WAN Gateway' : '',
        ifType: 6, // ethernetCsmacd
        ifTypeName: 'ethernetCsmacd',
        ifAdminStatus: 'UP',
        ifOperStatus: i === 12 || i === 18 ? 'DOWN' : 'UP', // 2 ports initially down for realism
        ifSpeed: 1000000000,
        ifHighSpeed: 1000,
        macAddress: `00:E0:FC:${i.toString(16).padStart(2, '0')}:A1:B2`.toUpperCase(),
        lastStatusChange: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 4 SFP+ 10Gbps uplink ports
    for (let u = 1; u <= 4; u++) {
      const ifIndex = 24 + u;
      ports.push({
        switchId,
        ifIndex,
        ifName: `XGigabitEthernet0/0/${u}`,
        ifDescr: `Huawei 10GE Optical Uplink Port ${u}`,
        ifAlias: `Core Backbone Trunk ${u}`,
        ifType: 6,
        ifTypeName: 'ethernetCsmacd',
        ifAdminStatus: 'UP',
        ifOperStatus: 'UP',
        ifSpeed: 10000000000,
        ifHighSpeed: 10000,
        macAddress: `00:E0:FC:FF:0${u}:B2`.toUpperCase(),
        lastStatusChange: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await interfacesColl.insertMany(ports);
    console.log(`[Seed] Successfully populated ${ports.length} physical switch interfaces for Huawei S5720.`);
  } else {
    console.log(`[Seed] Switch already has ${count} interfaces configured.`);
  }

  await mongoose.disconnect();
  console.log('[Seed] Finished successfully.');
}

seedHuawei().catch(console.error);
