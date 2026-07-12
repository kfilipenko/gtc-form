import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';
import { attachMembershipDocumentLink, buildMembershipKnowledgeContext } from './membershipKnowledge.js';

export interface AzureFoundryAgentOptions {
  endpoint: string;
  agentName: string;
  agentVersion: string;
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

  async ask(question: string): Promise<string> {
    const enrichedQuestion = buildMembershipKnowledgeContext(question);
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

function applyMiraAnswerGuard(question: string, answer: string): string {
  const normalizedQuestion = question.toLowerCase();
  const storyPattern = /(истори|знаком|встреч|событ|пара|друг|партн[её]р|впечатл)/i;
  const tariffPattern = /(тариф|membership|уровн|покуп|подключ|стоим|цена|скидк|бонус|travel credits|loyalty|балл|elite|turbo|vip)/i;

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
