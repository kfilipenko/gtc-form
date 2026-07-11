import cors from '@fastify/cors';
import Fastify from 'fastify';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import pg from 'pg';
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

const { Pool } = pg;

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
          agentVersion: config.azureAiAgentVersion,
        })
      : null;
  const crmPool = config.databaseUrl ? new Pool({ connectionString: config.databaseUrl }) : null;

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
    azure_ai_agent_name: config.azureAiAgentName,
    azure_ai_agent_version: config.azureAiAgentVersion,
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

  app.get('/api/travelgtc/v1/crm/leads', async (request, reply) => {
    try {
      await requireCrmTeamMember(request, config, authStore);
      if (!crmPool) {
        return reply.send({ ok: true, leads: [] });
      }

      const result = await crmPool.query(
        `select l.id::text as lead_id, l.created_at::text, l.stage, l.primary_interest, l.declared_role,
                l.business_interest_level, l.recommended_next_step, l.summary,
                c.display_name, c.primary_channel, c.primary_contact, c.email, c.phone,
                i.body as last_message
         from travelgtc_leads l
         join travelgtc_contacts c on c.id = l.contact_id
         left join lateral (
           select body
           from travelgtc_interactions
           where lead_id = l.id
           order by created_at desc
           limit 1
         ) i on true
         order by l.created_at desc
         limit 100`,
      );

      return reply.send({ ok: true, leads: result.rows });
    } catch (error) {
      return sendCrmError(error, request, reply);
    }
  });

  app.get('/api/travelgtc/v1/crm/leads/:leadId', async (request, reply) => {
    try {
      await requireCrmTeamMember(request, config, authStore);
      if (!crmPool) {
        return reply.code(404).send({ ok: false, error: { code: 'not_found', message: 'Lead not found.' } });
      }

      const leadId = crmLeadIdParam(request.params);
      const leadResult = await crmPool.query(
        `select l.id::text as lead_id, l.created_at::text, l.updated_at::text, l.stage, l.primary_interest,
                l.declared_role, l.business_interest_level, l.source_path, l.recommended_next_step, l.summary,
                c.id::text as contact_id, c.display_name, c.primary_channel, c.primary_contact, c.email, c.phone,
                t.format, t.destination, t.approx_dates, t.audience_type, t.estimated_group_size,
                t.description as travel_description, t.important_details
         from travelgtc_leads l
         join travelgtc_contacts c on c.id = l.contact_id
         left join travelgtc_travel_ideas t on t.lead_id = l.id
         where l.id = $1::uuid
         limit 1`,
        [leadId],
      );
      const lead = leadResult.rows[0];
      if (!lead) {
        return reply.code(404).send({ ok: false, error: { code: 'not_found', message: 'Lead not found.' } });
      }

      const interactions = await crmPool.query(
        `select created_at::text, interaction_type, channel, direction, body
         from travelgtc_interactions
         where lead_id = $1::uuid
         order by created_at desc
         limit 50`,
        [leadId],
      );

      return reply.send({ ok: true, lead, interactions: interactions.rows });
    } catch (error) {
      return sendCrmError(error, request, reply);
    }
  });

  app.patch('/api/travelgtc/v1/crm/leads/:leadId', async (request, reply) => {
    try {
      const session = await requireCrmTeamMember(request, config, authStore);
      if (!crmPool) {
        return reply.code(404).send({ ok: false, error: { code: 'not_found', message: 'Lead not found.' } });
      }

      const leadId = crmLeadIdParam(request.params);
      const stage = crmStageFromBody(request.body);
      const result = await crmPool.query(
        `update travelgtc_leads
         set stage = $2,
             updated_at = now(),
             updated_by = $3
         where id = $1::uuid
         returning id::text as lead_id, stage`,
        [leadId, stage, `team:${session.user.userId}`],
      );
      if (!result.rowCount) {
        return reply.code(404).send({ ok: false, error: { code: 'not_found', message: 'Lead not found.' } });
      }

      return reply.send({ ok: true, lead: result.rows[0] });
    } catch (error) {
      return sendCrmError(error, request, reply);
    }
  });

  app.post('/api/travelgtc/v1/crm/leads/:leadId/interactions', async (request, reply) => {
    try {
      const session = await requireCrmTeamMember(request, config, authStore);
      if (!crmPool) {
        return reply.code(404).send({ ok: false, error: { code: 'not_found', message: 'Lead not found.' } });
      }

      const leadId = crmLeadIdParam(request.params);
      const note = crmNoteFromBody(request.body);
      const lead = await crmPool.query<{ contact_id: string }>(
        'select contact_id::text from travelgtc_leads where id = $1::uuid limit 1',
        [leadId],
      );
      if (!lead.rowCount) {
        return reply.code(404).send({ ok: false, error: { code: 'not_found', message: 'Lead not found.' } });
      }

      await crmPool.query(
        `insert into travelgtc_interactions (
           lead_id, contact_id, actor_user_id, interaction_type, channel, direction, body,
           human_approved, metadata_json, created_by, updated_by
         ) values ($1::uuid,$2::uuid,$3::uuid,'note','crm','internal',$4,true,$5,$6,$6)`,
        [
          leadId,
          lead.rows[0].contact_id,
          session.user.userId,
          note,
          JSON.stringify({ source: 'travelgtc_crm' }),
          `team:${session.user.userId}`,
        ],
      );

      return reply.code(201).send({ ok: true, message: 'note_created' });
    } catch (error) {
      return sendCrmError(error, request, reply);
    }
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
    if (crmPool) {
      await crmPool.end();
    }
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

async function requireCrmTeamMember(
  request: FastifyRequest,
  config: TravelGtcConfig,
  authStore: AuthStore,
): Promise<SessionLookupResult> {
  const session = await requireSession(request, config, authStore);
  const isTeamMember =
    (await authStore.hasProjectRole(session.user.userId, 'travelgtc', 'team')) ||
    (await authStore.hasProjectRole(session.user.userId, 'travelgtc', 'admin'));
  if (!isTeamMember) {
    throw new AuthRequiredError();
  }
  return session;
}

function crmLeadIdParam(params: unknown): string {
  const raw = params && typeof params === 'object' ? (params as Record<string, unknown>).leadId : undefined;
  const leadId = typeof raw === 'string' ? raw.trim() : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(leadId)) {
    throw new AuthValidationError({ lead_id: 'Invalid lead id.' });
  }
  return leadId;
}

function crmStageFromBody(body: unknown): string {
  const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const stage = typeof input.stage === 'string' ? input.stage.trim() : '';
  const allowed = ['new_lead', 'in_consultation', 'membership_interest', 'closed_won', 'closed_lost', 'archived'];
  if (!allowed.includes(stage)) {
    throw new AuthValidationError({ stage: 'Invalid CRM stage.' });
  }
  return stage;
}

function crmNoteFromBody(body: unknown): string {
  const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const note = typeof input.note === 'string' ? input.note.trim() : '';
  if (note.length < 2 || note.length > 2000) {
    throw new AuthValidationError({ note: 'Note must be between 2 and 2000 characters.' });
  }
  return note;
}

function sendCrmError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AuthRequiredError) {
    return reply.code(403).send({
      ok: false,
      error: {
        code: 'crm_access_denied',
        message: 'CRM access requires TravelGTC team membership.',
      },
    });
  }

  if (error instanceof AuthValidationError) {
    return reply.code(400).send({
      ok: false,
      error: {
        code: error.code,
        message: 'Проверьте данные CRM-запроса.',
        fields: error.fields,
      },
    });
  }

  request.log.error(error);
  return reply.code(500).send({
    ok: false,
    error: {
      code: 'crm_internal_error',
      message: 'Internal CRM error.',
    },
  });
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
