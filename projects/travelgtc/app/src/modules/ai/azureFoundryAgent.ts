import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';

export interface AzureFoundryAgentOptions {
  endpoint: string;
  agentName: string;
}

export class AzureFoundryAgentClient {
  private readonly project: AIProjectClient;
  private readonly agentName: string;

  constructor(options: AzureFoundryAgentOptions) {
    this.project = new AIProjectClient(options.endpoint, new DefaultAzureCredential());
    this.agentName = options.agentName;
  }

  async ask(question: string): Promise<string> {
    const openAIClient = this.project.getOpenAIClient();
    const conversation = await openAIClient.conversations.create({
      items: [{ type: 'message', role: 'user', content: question }],
    });

    try {
      const response = await openAIClient.responses.create(
        {
          conversation: conversation.id,
        },
        {
          body: { agent: { name: this.agentName, type: 'agent_reference' } },
        },
      );

      const text = response.output_text?.trim();
      if (!text) {
        throw new Error('Azure agent returned an empty response.');
      }
      return text;
    } finally {
      await openAIClient.conversations.delete(conversation.id).catch(() => undefined);
    }
  }
}
