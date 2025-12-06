import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class EmailService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendTestEmail(to: string) {
    const subject = 'Test Email from NestJS Brevo (@nestjs-modules)';
    const text =
      'This is a test email sent via Brevo SMTP using NestJS (@nestjs-modules/mailer).';

    const html =
      '<b>This is a test email sent via Brevo SMTP using NestJS (@nestjs-modules/mailer).</b>';
    await this.sendEmail(to, subject, text, html);
  }

  async sendEmail(
    to: string | string[],
    subject: string,
    text: string,
    html?: string,
    from?: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: to,
        from: from || process.env.BREVO_SENDER_EMAIL,
        subject: subject,
        text: text,
        html: html,
      });
      this.logger.log(
        'warn',
        `Email successfully sent to ${Array.isArray(to) ? to.join(', ') : to}`,
      );
    } catch (error) {
      this.logger.error(
        'warn',
        `Failed to send email to ${Array.isArray(to) ? to.join(', ') : to}`,
        error,
      );
      throw error; // Re-throw or handle appropriately
    }
  }

  async sendResetPasswordLinkEmail(
    recipientEmail: string,
    resetLink: string,
  ): Promise<{ messageId: string }> {
    try {
      const info = await this.mailerService.sendMail({
        to: recipientEmail,
        from: process.env.BREVO_SENDER_EMAIL,
        subject: `${process.env.BREVO_TEMPLATE_APP_NAME} Password Reset Request`,
        text: `Hello, You requested a password reset for ${process.env.BREVO_TEMPLATE_APP_NAME}. 
              Go to ${resetLink} to update password. If you didn't request this password change, you can 
              safely ignore this email.`,
        html: `
          <html>
            <body>
              <p>Hello,</p>
              <p>You requested a password reset for ${process.env.BREVO_TEMPLATE_APP_NAME}. Click the link below to reset your password:</p>
              <p><a href="${resetLink}" target="_blank">Reset Password: ${resetLink}</a></p>
              <p>If you didn't request this password change, you can safely ignore this email.</p>
              <br>
              <p>Thanks,<br>Your ${process.env.BREVO_TEMPLATE_APP_NAME} Team</p>
            </body>
          </html>
        `,
      });
      return { messageId: info.messageId };
    } catch (error) {
      this.logger.log(
        'warn',
        `Error sending email in email service to standard user requesting password reset: ${error}`,
      );
      throw new Error('Unable to send email');
    }
  }

  async sendAccountVerificationEmail(
    userEmail: string,
    confirmationCode: string,
    verificationUrl: string,
  ): Promise<any> {
    try {
      
      const info = await this.mailerService.sendMail({
        to: userEmail,
        from: process.env.BREVO_SENDER_EMAIL,
        subject: `${process.env.BREVO_TEMPLATE_APP_NAME} Account Verification`,
        text: `Hello and welcome to ${process.env.BREVO_TEMPLATE_APP_NAME}!.
              Visit ${verificationUrl} and enter the code: ${confirmationCode} to verify your new account. 
              If you did not register, you can safely ignore this email.
              Thank You!
              ${process.env.BREVO_TEMPLATE_APP_NAME} Team`,
        html: `
          <html>
            <body>
              <p>Hello and welcome to ${process.env.BREVO_TEMPLATE_APP_NAME}!</p>
              <p>
                Visit the link below and enter the following code to verify your account:
              </p>
              <p>
                <h2>
                  Confirmation Code: ${confirmationCode}
                </h2>
              <br>
              <p>Confirm Login: <a href="${verificationUrl}" target="_blank">${verificationUrl}</a></p>
              <br>
              <p>If you did not recently register this login, you can safely ignore this email.</p>
              <p>Thank you!</p>
              <p>${process.env.BREVO_TEMPLATE_APP_NAME} Team</p>
            </body>
          </html>
        `,
      });
      return { messageId: info.messageId };
    } catch (error) {
      this.logger.log(
        'warn',
        `Error sending email in email service to verify account registration: ${error}`,
      );
      throw new Error('Unable to send email');
    }
  }
}
