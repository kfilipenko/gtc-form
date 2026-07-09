import cors from '@fastify/cors';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import type { TravelGtcConfig } from './config.js';
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
}

export async function createTravelGtcApp({ config, store }: CreateTravelGtcAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.appEnv === 'test' ? false : { level: 'info' },
  });

  const limiter = new InMemoryRateLimiter(config.rateLimitWindowSeconds * 1000, config.rateLimitMax);

  await app.register(cors, {
    origin: true,
  });

  app.get('/api/travelgtc/v1/health', async () => ({
    ok: true,
    service: 'travelgtc-api',
    env: config.appEnv,
    lead_capture_enabled: config.publicLeadCaptureEnabled,
    agent_intake_mode: config.agentIntakeMode,
    parent_network_mode: config.parentNetworkMode,
  }));

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

  app.addHook('onClose', async () => {
    if (store.close) {
      await store.close();
    }
  });

  return app;
}
