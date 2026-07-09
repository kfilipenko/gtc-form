import type { LeadCreationResult, PublicLeadSubmission, StoredLeadBundle } from './types.js';

export interface LeadCreationContext {
  userId?: string;
  actor?: string;
}

export interface LeadStore {
  createLeadSubmission(submission: PublicLeadSubmission, context?: LeadCreationContext): Promise<LeadCreationResult>;
  close?(): Promise<void>;
}

export interface InspectableLeadStore extends LeadStore {
  listBundles(): StoredLeadBundle[];
}
