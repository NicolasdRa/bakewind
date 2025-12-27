import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailtrapClient } from 'mailtrap';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface StaffInviteEmailData {
  recipientEmail: string;
  recipientName: string;
  businessName: string;
  position?: string | undefined;
  inviterName?: string | undefined;
  temporaryPassword: string;
  loginUrl: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private client: MailtrapClient | null = null;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isEnabled: boolean;
  private readonly isSandbox: boolean;

  constructor(private configService: ConfigService) {
    const apiToken = this.configService.get<string>('MAILTRAP_API_TOKEN');
    this.fromEmail = this.configService.get<string>('MAILTRAP_FROM_EMAIL') || 'noreply@bakewind.com';
    this.fromName = this.configService.get<string>('MAILTRAP_FROM_NAME') || 'BakeWind';
    this.isEnabled = !!apiToken;

    // Sandbox mode for development/testing - emails go to Mailtrap inbox
    this.isSandbox = this.configService.get<string>('MAILTRAP_SANDBOX') === 'true';
    const testInboxId = this.configService.get<string>('MAILTRAP_TEST_INBOX_ID');

    if (apiToken) {
      const clientConfig: { token: string; sandbox?: boolean; testInboxId?: number } = {
        token: apiToken,
      };

      // Configure sandbox mode if enabled
      if (this.isSandbox && testInboxId) {
        clientConfig.sandbox = true;
        clientConfig.testInboxId = parseInt(testInboxId, 10);
        this.logger.log('Mailtrap email service initialized in SANDBOX mode');
      } else {
        this.logger.log('Mailtrap email service initialized in PRODUCTION mode');
      }

      this.client = new MailtrapClient(clientConfig);
    } else {
      this.logger.warn('Mailtrap API token not configured - emails will be logged only');
    }
  }

  /**
   * Send a raw email
   */
  async send(options: SendEmailOptions): Promise<boolean> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    if (!this.client || !this.isEnabled) {
      this.logger.warn('Email service not configured, logging email instead:');
      this.logger.log(`To: ${recipients.join(', ')}`);
      this.logger.log(`Subject: ${options.subject}`);
      this.logger.log(`Body: ${options.text || options.html.substring(0, 200)}...`);
      return true;
    }

    try {
      const sender = {
        email: this.fromEmail,
        name: this.fromName,
      };

      await this.client.send({
        from: sender,
        to: recipients.map(email => ({ email })),
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent successfully to ${recipients.join(', ')}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send staff invitation email
   */
  async sendStaffInvitation(data: StaffInviteEmailData): Promise<boolean> {
    const html = this.getStaffInvitationTemplate(data);
    const text = this.getStaffInvitationTextTemplate(data);

    return this.send({
      to: data.recipientEmail,
      subject: `You're invited to join ${data.businessName} on BakeWind`,
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, name: string, resetUrl: string): Promise<boolean> {
    const html = this.getPasswordResetTemplate(name, resetUrl);
    const text = `Hi ${name},\n\nYou requested to reset your password. Click the link below to create a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\n- The BakeWind Team`;

    return this.send({
      to: email,
      subject: 'Reset your BakeWind password',
      html,
      text,
    });
  }

  /**
   * Send welcome email for new user registration
   */
  async sendWelcomeEmail(data: {
    email: string;
    firstName: string;
    businessName?: string;
    dashboardUrl: string;
    isTrialSignup?: boolean;
    trialDays?: number;
  }): Promise<boolean> {
    const html = this.getWelcomeEmailTemplate(data);
    const text = this.getWelcomeEmailTextTemplate(data);

    const subject = data.isTrialSignup
      ? `Welcome to BakeWind! Your ${data.trialDays || 14}-day trial has started`
      : 'Welcome to BakeWind!';

    return this.send({
      to: data.email,
      subject,
      html,
      text,
    });
  }

  /**
   * HTML template for staff invitation
   */
  private getStaffInvitationTemplate(data: StaffInviteEmailData): string {
    const positionText = data.position ? ` as ${data.position}` : '';
    const inviterText = data.inviterName ? `${data.inviterName} has` : 'You have been';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${data.businessName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🥐 BakeWind</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Bakery Management Platform</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">
                Welcome to the team! 🎉
              </h2>

              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
                Hi ${data.recipientName},
              </p>

              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
                ${inviterText} invited you to join <strong>${data.businessName}</strong>${positionText} on BakeWind.
              </p>

              <!-- Credentials Box -->
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 12px; color: #92400e; font-size: 14px; font-weight: 600;">
                  🔐 Your Login Credentials
                </p>
                <p style="margin: 0 0 8px; color: #78350f; font-size: 14px;">
                  <strong>Email:</strong> ${data.recipientEmail}
                </p>
                <p style="margin: 0; color: #78350f; font-size: 14px;">
                  <strong>Temporary Password:</strong> <code style="background: #fde68a; padding: 2px 6px; border-radius: 4px;">${data.temporaryPassword}</code>
                </p>
              </div>

              <p style="margin: 0 0 24px; color: #52525b; font-size: 14px; line-height: 1.6;">
                Please log in and change your password as soon as possible for security.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center; padding: 8px 0;">
                    <a href="${data.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3);">
                      Log In to BakeWind
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #a1a1aa; font-size: 13px; text-align: center;">
                If the button doesn't work, copy and paste this link:<br>
                <a href="${data.loginUrl}" style="color: #f97316;">${data.loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 8px; color: #71717a; font-size: 13px;">
                Questions? Contact your manager or reply to this email.
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © ${new Date().getFullYear()} BakeWind. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Plain text template for staff invitation
   */
  private getStaffInvitationTextTemplate(data: StaffInviteEmailData): string {
    const positionText = data.position ? ` as ${data.position}` : '';
    const inviterText = data.inviterName ? `${data.inviterName} has` : 'You have been';

    return `
Welcome to the team!

Hi ${data.recipientName},

${inviterText} invited you to join ${data.businessName}${positionText} on BakeWind.

Your Login Credentials:
- Email: ${data.recipientEmail}
- Temporary Password: ${data.temporaryPassword}

Please log in and change your password as soon as possible for security.

Log in here: ${data.loginUrl}

Questions? Contact your manager or reply to this email.

- The BakeWind Team
    `.trim();
  }

  /**
   * HTML template for password reset
   */
  private getPasswordResetTemplate(name: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🥐 BakeWind</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">
                Reset Your Password
              </h2>

              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
                Hi ${name},
              </p>

              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center; padding: 8px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #71717a; font-size: 14px; text-align: center;">
                This link expires in 1 hour.
              </p>

              <p style="margin: 16px 0 0; color: #a1a1aa; font-size: 13px; text-align: center;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © ${new Date().getFullYear()} BakeWind. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * HTML template for welcome email
   */
  private getWelcomeEmailTemplate(data: {
    firstName: string;
    businessName?: string;
    dashboardUrl: string;
    isTrialSignup?: boolean;
    trialDays?: number;
  }): string {
    const trialText = data.isTrialSignup
      ? `Your ${data.trialDays || 14}-day free trial has started!`
      : '';
    const businessText = data.businessName
      ? `We're excited to have <strong>${data.businessName}</strong> on board.`
      : "We're excited to have you on board.";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to BakeWind</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🥐 BakeWind</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Bakery Management Platform</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">
                Welcome to BakeWind! 🎉
              </h2>

              <p style="margin: 0 0 16px; color: #52525b; font-size: 16px; line-height: 1.6;">
                Hi ${data.firstName},
              </p>

              <p style="margin: 0 0 16px; color: #52525b; font-size: 16px; line-height: 1.6;">
                ${businessText}
              </p>

              ${data.isTrialSignup ? `
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                  🎁 ${trialText}
                </p>
                <p style="margin: 8px 0 0; color: #78350f; font-size: 14px;">
                  Explore all features free for ${data.trialDays || 14} days. No credit card required.
                </p>
              </div>
              ` : ''}

              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
                Here's what you can do with BakeWind:
              </p>

              <ul style="margin: 0 0 24px; padding-left: 24px; color: #52525b; font-size: 14px; line-height: 1.8;">
                <li>Manage orders and track production</li>
                <li>Organize recipes and calculate costs</li>
                <li>Track inventory and reduce waste</li>
                <li>Manage your team and schedules</li>
                <li>View analytics and insights</li>
              </ul>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center; padding: 8px 0;">
                    <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3);">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #a1a1aa; font-size: 13px; text-align: center;">
                Questions? Just reply to this email - we're here to help!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © ${new Date().getFullYear()} BakeWind. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Plain text template for welcome email
   */
  private getWelcomeEmailTextTemplate(data: {
    firstName: string;
    businessName?: string;
    dashboardUrl: string;
    isTrialSignup?: boolean;
    trialDays?: number;
  }): string {
    const trialText = data.isTrialSignup
      ? `Your ${data.trialDays || 14}-day free trial has started!`
      : '';
    const businessText = data.businessName
      ? `We're excited to have ${data.businessName} on board.`
      : "We're excited to have you on board.";

    return `
Welcome to BakeWind!

Hi ${data.firstName},

${businessText}

${data.isTrialSignup ? trialText + '\nExplore all features free for ' + (data.trialDays || 14) + ' days. No credit card required.\n' : ''}

Here's what you can do with BakeWind:
- Manage orders and track production
- Organize recipes and calculate costs
- Track inventory and reduce waste
- Manage your team and schedules
- View analytics and insights

Get started: ${data.dashboardUrl}

Questions? Just reply to this email - we're here to help!

- The BakeWind Team
    `.trim();
  }
}
