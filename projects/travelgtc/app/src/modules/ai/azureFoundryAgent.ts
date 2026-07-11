import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';

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
    const openAIClient = this.project.getOpenAIClient();
    const response = await openAIClient.responses.create(
      {
        input: [{ role: 'user', content: question }],
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
    return applyMiraAnswerGuard(question, text);
  }
}

function applyMiraAnswerGuard(question: string, answer: string): string {
  const normalizedQuestion = question.toLowerCase();
  const storyPattern = /(истори|знаком|встреч|событ|пара|друг|партн[её]р|впечатл|путешеств)/i;
  const tariffPattern = /(тариф|membership|уровн|покуп|подключ|стоим|цена|скидк|бонус|travel credits)/i;

  let guarded = answer;

  if (storyPattern.test(normalizedQuestion) && !/не\s+обещан|не\s+обещаю|не\s+гарант|пример[^.]{0,80}не\s+обещ/i.test(guarded)) {
    guarded += '\n\nЭто пример атмосферы и возможного сценария общения, не обещание результата.';
  }

  if (
    tariffPattern.test(normalizedQuestion) &&
    /(скидк|бонус|travel credits|standard|plus|pro|elite|preferred|essentials)/i.test(guarded) &&
    !/провер(яйте|ить|им)|официальн/i.test(guarded.slice(-280))
  ) {
    guarded +=
      '\n\nНазвания уровней, цены, скидки, бонусы, Travel Credits и точные преимущества нужно проверять по актуальному официальному Membership Benefits PDF или с партнёром TravelGTC.';
  }

  return guarded;
}
