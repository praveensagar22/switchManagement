import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { IAlert } from '../models/Alert.model.js';
import { ISwitch } from '../models/Switch.model.js';
import { IInterface } from '../models/Interface.model.js';
import { NotificationLogModel } from '../models/NotificationLog.model.js';

export class NotificationService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter | null {
    if (!config.smtp.enabled) {
      return null;
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass
        }
      });
    }
    return this.transporter;
  }

  /**
   * Dispatches email notification for an alert
   */
  public static async sendAlertEmail(
    alert: IAlert,
    switchDoc: ISwitch,
    interfaceDoc?: IInterface | null
  ): Promise<void> {
    const portName = interfaceDoc?.ifName || (alert.ifIndex ? `Port ${alert.ifIndex}` : 'System');
    const isResolved = alert.status === 'RESOLVED';
    const subject = `[${alert.severity}] ${isResolved ? 'RESOLVED: ' : ''}${switchDoc.name} (${switchDoc.ipAddress}) - ${alert.alertType} on ${portName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: ${isResolved ? '#10b981' : alert.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}; padding: 16px 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">
            ${isResolved ? '✓ Alert Resolved' : '⚠ Alert Triggered'} - ${alert.severity}
          </h2>
        </div>
        <div style="padding: 24px; background-color: #ffffff; color: #1e293b;">
          <p style="font-size: 16px; font-weight: bold; margin-top: 0;">${alert.message}</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 140px;">Switch:</td>
              <td style="padding: 8px 0;">${switchDoc.name} (${switchDoc.ipAddress})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Vendor / Model:</td>
              <td style="padding: 8px 0;">${switchDoc.vendor} ${switchDoc.model || ''}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Port / Interface:</td>
              <td style="padding: 8px 0;"><strong>${portName}</strong> (ifIndex: ${alert.ifIndex || 'N/A'})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Time:</td>
              <td style="padding: 8px 0;">${new Date(alert.triggeredAt).toLocaleString()}</td>
            </tr>
            ${
              isResolved && alert.resolvedAt
                ? `<tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Resolved Time:</td>
                    <td style="padding: 8px 0;">${new Date(alert.resolvedAt).toLocaleString()}</td>
                  </tr>`
                : ''
            }
          </table>
        </div>
        <div style="background-color: #f8fafc; padding: 12px 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          Sent by Network Switch Management System
        </div>
      </div>
    `;

    if (!config.smtp.enabled) {
      console.log(`[NotificationService] (Email Disabled) Alert notification logged for: ${subject}`);
      return;
    }

    const transporter = this.getTransporter();
    if (!transporter) return;

    try {
      await transporter.sendMail({
        from: config.smtp.from,
        to: config.smtp.to,
        subject,
        html
      });

      await NotificationLogModel.create({
        alertId: alert._id,
        channel: 'EMAIL',
        recipient: config.smtp.to,
        subject,
        status: 'SENT',
        sentAt: new Date()
      });

      alert.notificationStatus = 'SENT';
      await alert.save();
      console.log(`[NotificationService] Email sent successfully to ${config.smtp.to}`);
    } catch (error: any) {
      console.error('[NotificationService] Failed to send email alert:', error.message || error);
      await NotificationLogModel.create({
        alertId: alert._id,
        channel: 'EMAIL',
        recipient: config.smtp.to,
        subject,
        status: 'FAILED',
        errorMessage: error.message || String(error),
        sentAt: new Date()
      });

      alert.notificationStatus = 'FAILED';
      await alert.save();
    }
  }

  /**
   * Test SMTP configuration
   */
  public static async testEmail(targetEmail: string): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) {
      throw new Error('SMTP is not enabled. Set ENABLE_EMAIL_ALERTS=true in .env to enable email sending.');
    }

    await transporter.sendMail({
      from: config.smtp.from,
      to: targetEmail,
      subject: 'Test Notification - Network Switch Monitoring',
      html: '<p>This is a test notification from your Network Switch Monitoring platform. SMTP is working correctly.</p>'
    });

    return true;
  }
}
