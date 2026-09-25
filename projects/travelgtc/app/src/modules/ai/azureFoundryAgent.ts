import {travelHandoff} from './miraTravelHandoff.js';
import {askMiraV6} from './miraRuntimeV6.js';
import {askMira42} from './miraRuntime.js';
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

  async ask(question: string, history: AzureFoundryAgentHistoryTurn[] = [], maxOutputTokens?: number, runtime?: {question: string; completedTurns: number}): Promise<string> {
    if (runtime && this.agentName.startsWith('AI-TravelGTC')) {
      const t=runtime.question.toLowerCase().replace(/[!?.,—]/g,' ').replace(/\s+/g,' ').trim();
      if (/^(мира )?(привет|здравствуй|здравствуйте|как дела|как ты|как настроение|как твои дела)( мира)?$/.test(t)) return 'Настроение — чемоданное! Готова обсуждать новые маршруты. А вы давно выбирались в путешествие?';
      if (/^(мира )?(пошути|расскажи шутку|расскажи анекдот|рассмеши меня)( про путешествия| о путешествиях)?$/.test(t)) return 'Мой любимый багаж — хорошие впечатления. У них хотя бы нет перевеса! Куда вам хочется отправиться?';
    }
    const handoff = runtime && this.agentName.startsWith('AI-TravelGTC') ? travelHandoff(runtime.question, history) : null;
    if (handoff) return handoff;
    if (this.agentName === 'AI-TravelGTC' && ['43','44','45','46','47'].includes(this.agentVersion)) {
      if (!runtime) throw new Error('Mira runtime context required');
      return askMiraV6(this.project.getOpenAIClient(), this.agentName, runtime.question, history, runtime.completedTurns, undefined, this.agentVersion);
    }
    if (this.agentName === 'AI-TravelGTC-v6-candidate' && this.agentVersion === '2') {
      if (!runtime) throw new Error('Mira candidate runtime context required');
      return askMiraV6(this.project.getOpenAIClient(), this.agentName, runtime.question, history, runtime.completedTurns);
    }
    if (this.agentVersion === '42') {
      if (!runtime) throw new Error('Mira runtime context required');
      return askMira42(this.project.getOpenAIClient(), this.agentName, runtime.question, history, runtime.completedTurns);
    }
    const enrichedQuestion = buildMembershipKnowledgeContext(buildContextualQuestion(question, history));
    const openAIClient = this.project.getOpenAIClient();
    const response = await openAIClient.responses.create(
      {
        input: [{ role: 'user', content: enrichedQuestion }],
        ...(maxOutputTokens ? { max_output_tokens: maxOutputTokens } : {}),
      },
      {
        timeout: 45000,
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
    if (!text || response.status === 'incomplete') {
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
    'Контекст TravelGTC: это продолжение уже начатого диалога с пользователем.',
    'Учитывай историю ниже и не начинай разговор с нуля.',
    'Не повторяй в каждом ответе приветствие вроде "рада снова видеть". Если история уже активна, отвечай сразу по сути: короткая теплая реакция, один живой образ или улыбка, затем один следующий вопрос.',
    'Продолжай выбранное направление: путешествия, Life Experiences или явный Ambassador-интерес. Не превращай семью или группу в бизнес-интерес.',
    'Если пользователь возвращается после паузы, покажи, что разговор продолжается: назови последний видимый мотив из истории и предложи следующий маленький шаг.',
    'Не выдавай длинную презентацию после возвращения. Один ответ должен вести к одному следующему вопросу или к одной ссылке, если пользователь уже попросил ссылку.',
    'Ориентир качества: ответить на текущую потребность и предложить подходящий следующий шаг, включая продолжение знакомства без покупки.',
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
  let guarded = withoutUnsupportedSavings.length === sentences.length ? answer.trim() : withoutUnsupportedSavings.join(' ').trim();

  if (!dialogueFirst && /(?:loyalty points|loyalty point|лояльн[а-яё]*\s+балл)/i.test(guarded)) {
    guarded = guarded.replace(
      /(?:Loyalty Points?|Лояльн[а-яё]*\s+балл[а-яё]*)\s+(?:это\s+)?(?:деньги|наличные|cash)/giu,
      'Loyalty Points - не наличные',
    );
  }

  return guarded || 'Польза членства зависит от конкретной поездки. Без сопоставимых актуальных предложений я не могу подтвердить экономию. Какие даты и направление вы рассматриваете?';
}
