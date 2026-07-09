export class ValidationFailedError extends Error {
  readonly code = 'validation_failed';

  constructor(readonly fields: Record<string, string>) {
    super('Validation failed');
  }
}

export class DuplicateSubmissionError extends Error {
  readonly code = 'duplicate_submission';

  constructor(readonly leadId?: string, readonly contactId?: string, readonly stage?: string) {
    super('Duplicate lead submission');
  }
}

export class RateLimitedError extends Error {
  readonly code = 'rate_limited';

  constructor() {
    super('Too many submissions');
  }
}

export class LeadCaptureDisabledError extends Error {
  readonly code = 'lead_capture_disabled';

  constructor() {
    super('Public lead capture is disabled');
  }
}
