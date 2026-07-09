import { randomUUID } from 'node:crypto';
import { DuplicateSubmissionError } from '../errors.js';
import { createIntakeAgentStubOutput } from '../intakeAgentStub.js';
import type { InspectableLeadStore, LeadCreationContext } from '../leadStore.js';
import type { LeadCreationResult, PublicLeadSubmission, StoredLeadBundle } from '../types.js';

export class MemoryLeadStore implements InspectableLeadStore {
  private readonly bundles: StoredLeadBundle[] = [];
  private readonly clientEventIndex = new Map<string, StoredLeadBundle>();

  async createLeadSubmission(submission: PublicLeadSubmission, context: LeadCreationContext = {}): Promise<LeadCreationResult> {
    const clientEventId = submission.tracking.client_event_id;
    if (clientEventId) {
      const existing = this.clientEventIndex.get(clientEventId);
      if (existing) {
        throw new DuplicateSubmissionError(existing.leadId, existing.contactId, existing.stage);
      }
    }

    const intakeOutput = createIntakeAgentStubOutput(submission);
    const bundle: StoredLeadBundle = {
      contactId: randomUUID(),
      leadId: randomUUID(),
      travelIdeaId: randomUUID(),
      interactionId: randomUUID(),
      taskId: randomUUID(),
      agentRunId: randomUUID(),
      stage: 'new_lead',
      submission,
      intakeOutput,
      userId: context.userId,
    };

    this.bundles.push(bundle);
    if (clientEventId) {
      this.clientEventIndex.set(clientEventId, bundle);
    }

    return {
      contactId: bundle.contactId,
      leadId: bundle.leadId,
      travelIdeaId: bundle.travelIdeaId,
      interactionId: bundle.interactionId,
      taskId: bundle.taskId,
      agentRunId: bundle.agentRunId,
      stage: bundle.stage,
    };
  }

  listBundles(): StoredLeadBundle[] {
    return [...this.bundles];
  }
}
