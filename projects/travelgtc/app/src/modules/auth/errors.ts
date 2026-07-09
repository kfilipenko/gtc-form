export class AuthValidationError extends Error {
  readonly code = 'auth_validation_failed';

  constructor(readonly fields: Record<string, string>) {
    super('Auth validation failed');
  }
}

export class AccountAlreadyExistsError extends Error {
  readonly code = 'account_already_exists';

  constructor() {
    super('Account already exists');
  }
}

export class InvalidCredentialsError extends Error {
  readonly code = 'invalid_credentials';

  constructor() {
    super('Invalid credentials');
  }
}

export class AuthRequiredError extends Error {
  readonly code = 'auth_required';

  constructor() {
    super('Authentication required');
  }
}

export class EmailVerificationTokenError extends Error {
  readonly code: string;

  constructor(code: 'email_verification_token_invalid' | 'email_verification_token_expired') {
    super(code);
    this.code = code;
  }
}
