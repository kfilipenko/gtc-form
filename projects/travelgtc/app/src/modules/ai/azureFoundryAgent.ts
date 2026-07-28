import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';
import {
  TRAVEL_ADVANTAGE_FREE_GUEST_PASS_URL,
  TRAVEL_ADVANTAGE_VIP_MEMBERSHIP_URL,
  attachMembershipDocumentLink,
  buildMembershipKnowledgeContext,
} from './membershipKnowledge.js';

export interface AzureFoundryAgentOptions {
  endpoint: string;
  agentName: string;
  agentVersion: string;
}

export interface AzureFoundryAgentHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export class AzureFoundryAgentClient {
  private readonly project: AIProjectClient;
  private readonly agentName: string;
  private readonly agentVersion: string;

  constructor(options: AzureFoundryAgentOptions) {
    this.project = new AIProjectClient(options.endpoint, new DefaultAzureCredential());
    this.agentName = options.agentName;
    this.agentVersion = options.agentVersion;
  }

  async ask(question: string, history: AzureFoundryAgentHistoryTurn[] = []): Promise<string> {
    const enrichedQuestion = buildMembershipKnowledgeContext(buildContextualQuestion(question, history));
    const openAIClient = this.project.getOpenAIClient();
    const response = await openAIClient.responses.create(
      {
        input: [{ role: 'user', content: enrichedQuestion }],
      },
      {
        body: {
          agent_reference: {
            name: this.agentName,
            version: this.agentVersion,
            type: 'agent_reference',
          },
        },
      },
    );

    const text = response.output_text?.trim();
    if (!text) {
      throw new Error('Azure agent returned an empty response.');
    }
    return applyMiraAnswerGuard(question, attachMembershipDocumentLink(question, text));
  }
}

function buildContextualQuestion(question: string, history: AzureFoundryAgentHistoryTurn[]): string {
  const cleanHistory = history
    .map((turn) => ({
      role: turn.role,
      content: turn.content.replace(/\s+/g, ' ').trim(),
    }))
    .filter((turn) => turn.content)
    .slice(-12);

  if (!cleanHistory.length) {
    return question;
  }

  const transcript = cleanHistory.map((turn) => `${turn.role === 'user' ? 'Пользователь' : 'Мира'}: ${turn.content}`).join('\n');
  return [
    'Контекст CRM TravelGTC: это продолжение уже начатого авторизованного диалога с пользователем.',
    'Учитывай историю ниже, приветствуй пользователя как вернувшегося собеседника и не начинай разговор с нуля.',
    'Продолжай мягкую продажу через выявление потребностей: семья, друзья, группы, клиенты, события, Elite, Turbo add-on, Ambassador.',
    '',
    'История диалога:',
    transcript,
    '',
    `Новый вопрос пользователя: ${question}`,
  ].join('\n');
}

function applyMiraAnswerGuard(question: string, answer: string): string {
  const normalizedQuestion = question.toLowerCase();
  const storyPattern = /(истори|знаком|встреч|событ|пара|друг|партн[её]р|впечатл)/i;
  const tariffPattern = /(тариф|membership|уровн|покуп|подключ|стоим|цена|скидк|бонус|travel credits|loyalty|балл|elite|turbo|vip)/i;
  const guestAccessPattern = /(guest pass|гостев|demo|демо|trial|free|посмотреть|интерфейс)/i;

  let guarded = answer;

  if (storyPattern.test(normalizedQuestion) && !/не\s+обещан|не\s+обещаю|не\s+гарант|пример[^.]{0,80}не\s+обещ/i.test(guarded)) {
    guarded += '\n\nЭто пример атмосферы и возможного сценария общения, не обещание результата.';
  }

  if (/(loyalty points|балл)/i.test(guarded)) {
    guarded = guarded.replace(
      /например,\s*(?:отел(?:ей|и|ях|ь)?|авиабилет(?:ов|ы|ах)?|круиз(?:ов|ы|ах)?)[^.\n]{0,140}/giu,
      'например, допустимых заказов, где официальный booking flow разрешает списание',
    );
  }

  if (guestAccessPattern.test(normalizedQuestion) && !guarded.includes(TRAVEL_ADVANTAGE_VIP_MEMBERSHIP_URL)) {
    const vipFit =
      /(vip|elite|элит|membership|тариф|семь|друз|групп|клиент|балл|loyalty|событ|ambassador|амбассад|куп|оплат|сравн)/i.test(
        normalizedQuestion,
      );
    const primaryAccess = vipFit
      ? `🌟 VIP Membership Travel Advantage: ${TRAVEL_ADVANTAGE_VIP_MEMBERSHIP_URL}`
      : `🆓 Free Guest Pass Travel Advantage: ${TRAVEL_ADVANTAGE_FREE_GUEST_PASS_URL}`;
    const secondaryAccess = vipFit
      ? `🆓 Free Guest Pass Travel Advantage: ${TRAVEL_ADVANTAGE_FREE_GUEST_PASS_URL}`
      : `🌟 VIP Membership Travel Advantage: ${TRAVEL_ADVANTAGE_VIP_MEMBERSHIP_URL}`;
    guarded += `\n\n${primaryAccess}\n${secondaryAccess}\n\nFree Guest Pass подходит для первого знакомства без кредитной карты и имеет ограничение: 1 hotel booking максимум на 2 ночи. VIP Membership ведёт к платному VIP-членству и official checkout. Если есть семья, группа, клиенты, баллы, Elite, Turbo или Ambassador-сценарий, сначала лучше сравнить уровни Membership.`;
  }

  if (
    tariffPattern.test(normalizedQuestion) &&
    /(скидк|бонус|travel credits|loyalty|балл|elite|turbo|vip180|standard|plus|pro|preferred|essentials)/i.test(guarded) &&
    !/провер(яйте|ить|им)|официальн/i.test(guarded.slice(-280))
  ) {
    guarded +=
      '\n\nЦифры по уровням, баллам, Travel Credits, Turbo add-on и точные правила применения нужно сверять по рабочему документу TravelGTC, официальному Membership Benefits PDF или с партнёром TravelGTC.';
  }

  return guarded;
}
