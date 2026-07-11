import cors from '@fastify/cors';
import Fastify from 'fastify';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { TravelGtcConfig } from './config.js';
import { clearCookie, parseCookieValue, serializeCookie } from '../modules/auth/cookies.js';
import {
  AccountAlreadyExistsError,
  AuthRequiredError,
  AuthValidationError,
  EmailVerificationTokenError,
  InvalidCredentialsError,
} from '../modules/auth/errors.js';
import type { AuthStore } from '../modules/auth/authStore.js';
import type { AuthSession, RequestMetadata, SessionLookupResult } from '../modules/auth/types.js';
import {
  validateLoginInput,
  validateRegisterInput,
  validateVerificationTokenInput,
} from '../modules/auth/validation.js';
import { AzureFoundryAgentClient } from '../modules/ai/azureFoundryAgent.js';
import { buildMiraFallbackAnswer } from '../modules/ai/miraFallback.js';
import {
  DuplicateSubmissionError,
  LeadCaptureDisabledError,
  RateLimitedError,
  ValidationFailedError,
} from '../modules/public-leads/errors.js';
import type { LeadStore } from '../modules/public-leads/leadStore.js';
import { InMemoryRateLimiter } from '../modules/public-leads/rateLimiter.js';
import { validateNotObviousSpam, validatePublicLeadSubmission } from '../modules/public-leads/validation.js';

export interface CreateTravelGtcAppOptions {
  config: TravelGtcConfig;
  store: LeadStore;
  authStore: AuthStore;
}

export async function createTravelGtcApp({ config, store, authStore }: CreateTravelGtcAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.appEnv === 'test' ? false : { level: 'info' },
  });

  const limiter = new InMemoryRateLimiter(config.rateLimitWindowSeconds * 1000, config.rateLimitMax);
  const azureAgent =
    config.aiChatMode === 'azure' && config.azureAiProjectEndpoint
      ? new AzureFoundryAgentClient({
          endpoint: config.azureAiProjectEndpoint,
          agentName: config.azureAiAgentName,
        })
      : null;

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.get('/api/travelgtc/v1/health', async () => ({
    ok: true,
    service: 'travelgtc-api',
    env: config.appEnv,
    lead_capture_enabled: config.publicLeadCaptureEnabled,
    account_lead_capture_enabled: config.accountLeadCaptureEnabled,
    agent_intake_mode: config.agentIntakeMode,
    parent_network_mode: config.parentNetworkMode,
    ai_chat_mode: config.aiChatMode,
    azure_ai_agent_configured: Boolean(config.azureAiProjectEndpoint),
  }));

  app.post('/api/travelgtc/v1/ai/chat', async (request, reply) => {
    try {
      limiter.check(`${request.ip || 'unknown'}:ai-chat`);
      const question = validateAiQuestion(request.body);

      if (!azureAgent) {
        return reply.send({
          ok: true,
          mode: 'stub',
          agent: config.azureAiAgentName,
          answer: buildMiraFallbackAnswer(question),
        });
      }

      const answer = await azureAgent.ask(question);
      return reply.send({
        ok: true,
        mode: 'azure',
        agent: config.azureAiAgentName,
        answer,
      });
    } catch (error) {
      if (error instanceof RateLimitedError) {
        return reply.code(429).send({
          ok: false,
          error: {
            code: error.code,
            message: 'Too many AI chat requests.',
          },
        });
      }

      if (error instanceof AuthValidationError) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: error.code,
            message: 'Проверьте текст вопроса.',
            fields: error.fields,
          },
        });
      }

      request.log.error(error);
      return reply.code(502).send({
        ok: false,
        error: {
          code: 'ai_agent_unavailable',
          message: 'AI consultant is temporarily unavailable.',
        },
      });
    }
  });

  app.post('/api/travelgtc/v1/auth/register', async (request, reply) => {
    try {
      const input = validateRegisterInput(request.body, config);
      const user = await authStore.createUser(input, requestMetadata(request));
      const session = await authStore.createSession(user.userId, requestMetadata(request), sessionTtlSeconds(config));
      setSessionCookie(reply, config, session);
      const verification = await authStore.createEmailVerificationToken(
        user.userId,
        user.email,
        emailVerificationTtlSeconds(),
        config.authEmailVerificationTestMode,
      );

      return reply.code(201).send({
        ok: true,
        user: session.user,
        email_verification: {
          status: 'pending',
          delivery_status: verification.deliveryStatus,
          expires_at: verification.expiresAt,
          ...(config.authEmailVerificationTestMode ? { test_verification_token: verification.token } : {}),
        },
      });
    } catch (error) {
      return sendKnownError(error, request, reply);
    }
  });

  app.post('/api/travelgtc/v1/auth/login', async (request, reply) => {
    try {
      const input = validateLoginInput(request.body);
      const user = await authStore.authenticate(input, requestMetadata(request));
      const session = await authStore.createSession(user.userId, requestMetadata(request), sessionTtlSeconds(config));
      setSessionCookie(reply, config, session);

      return reply.send({
        ok: true,
        user: session.user,
      });
    } catch (error) {
      return sendKnownError(error, request, reply);
    }
  });

  app.post('/api/travelgtc/v1/auth/logout', async (request, reply) => {
    const token = parseCookieValue(request.headers.cookie, config.sessionCookieName);
    if (token) {
      await authStore.revokeSession(token);
    }
    reply.header('Set-Cookie', clearCookie(config.sessionCookieName, config.authSecureCookies));
    return reply.send({ ok: true });
  });

  app.get('/api/travelgtc/v1/auth/me', async (request, reply) => {
    const session = await currentSession(request, config, authStore);
    if (!session) {
      return reply.send({ ok: true, authenticated: false, user: null });
    }

    return reply.send({
      ok: true,
      authenticated: true,
      user: session.user,
      session: {
        expires_at: session.expiresAt,
      },
    });
  });

  app.post('/api/travelgtc/v1/auth/email/send-verification', async (request, reply) => {
    try {
      const session = await requireSession(request, config, authStore);
      const verification = await authStore.createEmailVerificationToken(
        session.user.userId,
        session.user.email,
        emailVerificationTtlSeconds(),
        config.authEmailVerificationTestMode,
      );

      return reply.send({
        ok: true,
        status: 'pending',
        delivery_status: verification.deliveryStatus,
        expires_at: verification.expiresAt,
        ...(config.authEmailVerificationTestMode ? { test_verification_token: verification.token } : {}),
      });
    } catch (error) {
      return sendKnownError(error, request, reply);
    }
  });

  app.post('/api/travelgtc/v1/auth/email/verify', async (request, reply) => {
    try {
      const token = validateVerificationTokenInput(request.body);
      const user = await authStore.verifyEmailToken(token);
      return reply.send({
        ok: true,
        user,
        email_verification_status: 'verified',
      });
    } catch (error) {
      return sendKnownError(error, request, reply);
    }
  });

  app.post('/api/travelgtc/v1/public/leads', async (request, reply) => {
    try {
      if (!config.publicLeadCaptureEnabled) {
        throw new LeadCaptureDisabledError();
      }

      limiter.check(request.ip || 'unknown');
      const submission = validatePublicLeadSubmission(request.body, config);
      validateNotObviousSpam(submission);
      const result = await store.createLeadSubmission(submission);

      return reply.code(201).send({
        ok: true,
        lead_id: result.leadId,
        contact_id: result.contactId,
        stage: result.stage,
        message: 'lead_created',
      });
    } catch (error) {
      if (error instanceof LeadCaptureDisabledError) {
        return reply.code(503).send({
          ok: false,
          error: {
            code: error.code,
            message: 'Public lead capture is disabled until consent and privacy readiness are approved.',
          },
        });
      }

      if (error instanceof ValidationFailedError) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: error.code,
            message: 'Проверьте обязательные поля.',
            fields: error.fields,
          },
        });
      }

      if (error instanceof DuplicateSubmissionError) {
        return reply.code(409).send({
          ok: false,
          error: {
            code: error.code,
            message: 'Duplicate lead submission.',
            lead_id: error.leadId,
            contact_id: error.contactId,
            stage: error.stage,
          },
        });
      }

      if (error instanceof RateLimitedError) {
        return reply.code(429).send({
          ok: false,
          error: {
            code: error.code,
            message: 'Too many submissions.',
          },
        });
      }

      request.log.error(error);
      return reply.code(500).send({
        ok: false,
        error: {
          code: 'internal_error',
          message: 'Internal server error.',
        },
      });
    }
  });

  app.post('/api/travelgtc/v1/account/leads', async (request, reply) => {
    try {
      if (!config.accountLeadCaptureEnabled) {
        throw new LeadCaptureDisabledError();
      }

      const session = await requireSession(request, config, authStore);
      limiter.check(`${request.ip || 'unknown'}:${session.user.userId}`);
      const submission = validatePublicLeadSubmission(request.body, config);
      validateNotObviousSpam(submission);
      await authStore.ensureProjectMembership(session.user.userId, 'travelgtc', 'interested');
      await authStore.ensureProjectRole(session.user.userId, 'travelgtc', submission.declared_role, 'account_lead_form');
      const result = await store.createLeadSubmission(submission, {
        userId: session.user.userId,
        actor: 'account_lead_api',
      });

      return reply.code(201).send({
        ok: true,
        lead_id: result.leadId,
        contact_id: result.contactId,
        stage: result.stage,
        message: 'authenticated_lead_created',
      });
    } catch (error) {
      return sendKnownError(error, request, reply);
    }
  });

  app.addHook('onClose', async () => {
    if (store.close) {
      await store.close();
    }
    if (authStore.close) {
      await authStore.close();
    }
  });

  return app;
}

function requestMetadata(request: FastifyRequest): RequestMetadata {
  return {
    ipAddress: request.ip || undefined,
    userAgent: request.headers['user-agent'],
  };
}

function validateAiQuestion(body: unknown): string {
  const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const question = typeof input.question === 'string' ? input.question.trim() : '';
  if (question.length < 2) {
    throw new AuthValidationError({ question: 'Question is required.' });
  }
  if (question.length > 1000) {
    throw new AuthValidationError({ question: 'Question is too long.' });
  }
  return question;
}

function sessionTtlSeconds(config: TravelGtcConfig): number {
  return config.sessionTtlDays * 24 * 60 * 60;
}

function emailVerificationTtlSeconds(): number {
  return 24 * 60 * 60;
}

function setSessionCookie(reply: FastifyReply, config: TravelGtcConfig, session: AuthSession): void {
  reply.header(
    'Set-Cookie',
    serializeCookie(config.sessionCookieName, session.token, {
      maxAgeSeconds: sessionTtlSeconds(config),
      httpOnly: true,
      sameSite: 'Lax',
      secure: config.authSecureCookies,
      path: '/',
    }),
  );
}

async function currentSession(
  request: FastifyRequest,
  config: TravelGtcConfig,
  authStore: AuthStore,
): Promise<SessionLookupResult | null> {
  const token = parseCookieValue(request.headers.cookie, config.sessionCookieName);
  return token ? authStore.getSession(token) : null;
}

async function requireSession(
  request: FastifyRequest,
  config: TravelGtcConfig,
  authStore: AuthStore,
): Promise<SessionLookupResult> {
  const session = await currentSession(request, config, authStore);
  if (!session) {
    throw new AuthRequiredError();
  }
  return session;
}

function sendKnownError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AuthValidationError) {
    return reply.code(400).send({
      ok: false,
      error: {
        code: error.code,
        message: 'Проверьте обязательные поля.',
        fields: error.fields,
      },
    });
  }

  if (error instanceof AccountAlreadyExistsError) {
    return reply.code(409).send({
      ok: false,
      error: {
        code: error.code,
        message: 'Account already exists. Use login.',
      },
    });
  }

  if (error instanceof InvalidCredentialsError) {
    return reply.code(401).send({
      ok: false,
      error: {
        code: error.code,
        message: 'Invalid email or password.',
      },
    });
  }

  if (error instanceof AuthRequiredError) {
    return reply.code(401).send({
      ok: false,
      error: {
        code: error.code,
        message: 'Authentication is required.',
      },
    });
  }

  if (error instanceof EmailVerificationTokenError) {
    return reply.code(400).send({
      ok: false,
      error: {
        code: error.code,
        message: 'Email verification token is invalid or expired.',
      },
    });
  }

  if (error instanceof LeadCaptureDisabledError) {
    return reply.code(503).send({
      ok: false,
      error: {
        code: error.code,
        message: 'Lead capture is disabled until consent and privacy readiness are approved.',
      },
    });
  }

  if (error instanceof ValidationFailedError) {
    return reply.code(400).send({
      ok: false,
      error: {
        code: error.code,
        message: 'Проверьте обязательные поля.',
        fields: error.fields,
      },
    });
  }

  if (error instanceof DuplicateSubmissionError) {
    return reply.code(409).send({
      ok: false,
      error: {
        code: error.code,
        message: 'Duplicate lead submission.',
        lead_id: error.leadId,
        contact_id: error.contactId,
        stage: error.stage,
      },
    });
  }

  if (error instanceof RateLimitedError) {
    return reply.code(429).send({
      ok: false,
      error: {
        code: error.code,
        message: 'Too many submissions.',
      },
    });
  }

  request.log.error(error);
  return reply.code(500).send({
    ok: false,
    error: {
      code: 'internal_error',
      message: 'Internal server error.',
    },
  });
}
