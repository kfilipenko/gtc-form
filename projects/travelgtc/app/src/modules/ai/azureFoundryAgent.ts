import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';
import {
  attachMembershipDocumentLink,
  buildMembershipKnowledgeContext,
  isDialogueFirstQuestion,
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
    'Учитывай историю ниже и не начинай разговор с нуля.',
    'Не повторяй в каждом ответе приветствие вроде "рада снова видеть". Если история уже активна, отвечай сразу по сути: короткая теплая реакция, один живой образ или улыбка, затем один следующий вопрос.',
    'Продолжай мягкую продажу через выявление потребностей: семья, друзья, группы, клиенты, события, Elite, Turbo add-on, Ambassador.',
    'Если пользователь возвращается после паузы, покажи, что разговор продолжается: назови последний видимый мотив из истории и предложи следующий маленький шаг.',
    'Не выдавай длинную презентацию после возвращения. Один ответ должен вести к одному следующему вопросу или к одной ссылке, если пользователь уже попросил ссылку.',
    'Ориентир качества: помочь пользователю увидеть пользу Membership и приблизиться к покупке или официальной регистрации, но через его собственную потребность.',
    '',
    'История диалога:',
    transcript,
    '',
    `Новый вопрос пользователя: ${question}`,
  ].join('\n');
}

export function applyMiraAnswerGuard(question: string, answer: string): string {
  const dialogueFirst = isDialogueFirstQuestion(question);
  const sentences = answer.split(/(?<=[.!?])\s+/u);
  const withoutUnsupportedSavings = sentences.filter(
    (sentence) =>
      !/(?:20\s*[–-]\s*50\s*%|\$\s*800\s*[–-]\s*\$?\s*1[\s,]?500)/i.test(sentence) ||
      !/(эконом|выгод|сбереж|окуп)/i.test(sentence),
  );
  let guarded = withoutUnsupportedSavings.join(' ').trim();

  if (!dialogueFirst && /(?:loyalty points|loyalty point|лояльн[а-яё]*\s+балл)/i.test(guarded)) {
    guarded = guarded.replace(
      /(?:Loyalty Points?|Лояльн[а-яё]*\s+балл[а-яё]*)\s+(?:это\s+)?(?:деньги|наличные|cash)/giu,
      'Loyalty Points - не наличные',
    );
  }

  return guarded || answer;
}
