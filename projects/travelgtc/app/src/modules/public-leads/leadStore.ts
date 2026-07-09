import type { LeadCreationResult, PublicLeadSubmission, StoredLeadBundle } from './types.js';

export interface LeadStore {
  createLeadSubmission(submission: PublicLeadSubmission): Promise<LeadCreationResult>;
  close?(): Promise<void>;
}

export interface InspectableLeadStore extends LeadStore {
  listBundles(): StoredLeadBundle[];
}
