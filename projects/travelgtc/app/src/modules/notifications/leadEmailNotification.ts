import nodemailer from 'nodemailer';
import type { TravelGtcConfig } from '../../server/config.js';
import type { LeadCreationResult, PublicLeadSubmission } from '../public-leads/types.js';

export interface LeadEmailNotificationSender {
  sendLeadCreated(submission: PublicLeadSubmission, result: LeadCreationResult): Promise<void>;
  sendAiPurchaseIntent(input: AiPurchaseIntentNotification): Promise<void>;
}

export interface AiPurchaseIntentNotification {
  leadId: string;
  displayName: string;
  email: string;
  phone?: string | null;
  question: string;
  answer: string;
  referralRegistrationUrl: string;
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

  async sendAiPurchaseIntent(): Promise<void> {
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
      envelope: {
        from: this.config.smtpUser,
        to: this.config.leadNotificationTo,
      },
      sender: this.config.smtpUser,
      to: this.config.leadNotificationTo,
      subject: `TravelGTC: новая заявка ${shortId(result.leadId)}`,
      text: buildLeadText(submission, result),
      html: buildLeadHtml(submission, result),
    });
  }

  async sendAiPurchaseIntent(input: AiPurchaseIntentNotification): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.leadNotificationFrom,
      envelope: {
        from: this.config.smtpUser,
        to: this.config.leadNotificationTo,
      },
      sender: this.config.smtpUser,
      to: this.config.leadNotificationTo,
      subject: `TravelGTC: горячий лид хочет подписаться ${shortId(input.leadId)}`,
      text: buildPurchaseIntentText(input),
      html: buildPurchaseIntentHtml(input),
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

function buildPurchaseIntentText(input: AiPurchaseIntentNotification): string {
  return [
    'Горячий лид TravelGTC: пользователь хочет подписаться',
    '',
    `Lead ID: ${input.leadId}`,
    `Имя: ${input.displayName}`,
    `Email: ${input.email}`,
    `Телефон: ${input.phone || '-'}`,
    '',
    'Запрос пользователя:',
    input.question,
    '',
    'Ответ Миры:',
    input.answer.slice(0, 1200),
    '',
    `Referral link: ${input.referralRegistrationUrl}`,
    '',
    'CRM:',
    'https://travelgtc.com/crm/',
  ].join('\n');
}

function buildPurchaseIntentHtml(input: AiPurchaseIntentNotification): string {
  return `
    <h2>Горячий лид TravelGTC: пользователь хочет подписаться</h2>
    <p><strong>Lead ID:</strong> ${escapeHtml(input.leadId)}</p>
    <table cellpadding="6" cellspacing="0" border="0">
      <tr><td><strong>Имя</strong></td><td>${escapeHtml(input.displayName)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${escapeHtml(input.email)}</td></tr>
      <tr><td><strong>Телефон</strong></td><td>${escapeHtml(input.phone || '-')}</td></tr>
    </table>
    <h3>Запрос пользователя</h3>
    <p>${escapeHtml(input.question).replace(/\n/g, '<br>')}</p>
    <h3>Ответ Миры</h3>
    <p>${escapeHtml(input.answer.slice(0, 1200)).replace(/\n/g, '<br>')}</p>
    <p><a href="${escapeHtml(input.referralRegistrationUrl)}">Открыть referral link</a></p>
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
