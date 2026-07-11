import nodemailer from 'nodemailer';
import type { TravelGtcConfig } from '../../server/config.js';
import type { LeadCreationResult, PublicLeadSubmission } from '../public-leads/types.js';

export interface LeadEmailNotificationSender {
  sendLeadCreated(submission: PublicLeadSubmission, result: LeadCreationResult): Promise<void>;
}

export function createLeadEmailNotificationSender(config: TravelGtcConfig): LeadEmailNotificationSender {
  if (
    config.emailNotificationMode !== 'smtp' ||
    !config.smtpHost ||
    !config.smtpUser ||
    !config.smtpPassword
  ) {
    return new DisabledLeadEmailNotificationSender();
  }

  return new SmtpLeadEmailNotificationSender(config);
}

class DisabledLeadEmailNotificationSender implements LeadEmailNotificationSender {
  async sendLeadCreated(): Promise<void> {
    return undefined;
  }
}

class SmtpLeadEmailNotificationSender implements LeadEmailNotificationSender {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: TravelGtcConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });
  }

  async sendLeadCreated(submission: PublicLeadSubmission, result: LeadCreationResult): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.leadNotificationFrom,
      to: this.config.leadNotificationTo,
      subject: `TravelGTC: новая заявка ${shortId(result.leadId)}`,
      text: buildLeadText(submission, result),
      html: buildLeadHtml(submission, result),
    });
  }
}

function buildLeadText(submission: PublicLeadSubmission, result: LeadCreationResult): string {
  return [
    'Новая заявка TravelGTC',
    '',
    `Lead ID: ${result.leadId}`,
    `Имя: ${submission.name}`,
    `Контакт: ${submission.contact_value}`,
    `Канал: ${submission.preferred_channel}`,
    `Интерес: ${submission.primary_interest}`,
    `Роль: ${submission.declared_role}`,
    `Бизнес-интерес: ${submission.business_interest_level ?? 'none'}`,
    '',
    'Сообщение:',
    submission.message,
    '',
    `Страница: ${submission.tracking.landing_path ?? '-'}`,
    `Источник: ${submission.tracking.referrer ?? '-'}`,
    '',
    'CRM:',
    'https://travelgtc.com/crm/',
  ].join('\n');
}

function buildLeadHtml(submission: PublicLeadSubmission, result: LeadCreationResult): string {
  return `
    <h2>Новая заявка TravelGTC</h2>
    <p><strong>Lead ID:</strong> ${escapeHtml(result.leadId)}</p>
    <table cellpadding="6" cellspacing="0" border="0">
      <tr><td><strong>Имя</strong></td><td>${escapeHtml(submission.name)}</td></tr>
      <tr><td><strong>Контакт</strong></td><td>${escapeHtml(submission.contact_value)}</td></tr>
      <tr><td><strong>Канал</strong></td><td>${escapeHtml(submission.preferred_channel)}</td></tr>
      <tr><td><strong>Интерес</strong></td><td>${escapeHtml(submission.primary_interest)}</td></tr>
      <tr><td><strong>Роль</strong></td><td>${escapeHtml(submission.declared_role)}</td></tr>
      <tr><td><strong>Бизнес-интерес</strong></td><td>${escapeHtml(submission.business_interest_level ?? 'none')}</td></tr>
      <tr><td><strong>Страница</strong></td><td>${escapeHtml(submission.tracking.landing_path ?? '-')}</td></tr>
      <tr><td><strong>Источник</strong></td><td>${escapeHtml(submission.tracking.referrer ?? '-')}</td></tr>
    </table>
    <h3>Сообщение</h3>
    <p>${escapeHtml(submission.message).replace(/\n/g, '<br>')}</p>
    <p><a href="https://travelgtc.com/crm/">Открыть CRM TravelGTC</a></p>
  `;
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
