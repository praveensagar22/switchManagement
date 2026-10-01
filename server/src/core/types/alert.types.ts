export type AlertType = 'PORT_DOWN' | 'DEVICE_UNREACHABLE' | 'FLAPPING';

export type AlertSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INFO';

export type AlertStatus = 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SUPPRESSED';
