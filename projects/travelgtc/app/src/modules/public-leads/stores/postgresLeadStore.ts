import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { DuplicateSubmissionError } from '../errors.js';
import { createIntakeAgentStubOutput } from '../intakeAgentStub.js';
import type { LeadCreationContext, LeadStore } from '../leadStore.js';
import type { LeadCreationResult, PublicLeadSubmission } from '../types.js';

const { Pool } = pg;

export class PostgresLeadStore implements LeadStore {
  private readonly pool: pg.Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async createLeadSubmission(submission: PublicLeadSubmission, context: LeadCreationContext = {}): Promise<LeadCreationResult> {
    const client = await this.pool.connect();
    const clientEventId = submission.tracking.client_event_id ?? null;

    try {
      await client.query('begin');

      if (clientEventId) {
        const existing = await client.query<{ id: string; contact_id: string; stage: string }>(
          'select id, contact_id, stage from travelgtc_leads where client_event_id = $1 limit 1',
          [clientEventId],
        );
        if (existing.rowCount) {
          throw new DuplicateSubmissionError(existing.rows[0].id, existing.rows[0].contact_id, existing.rows[0].stage);
        }
      }

      const contactId = randomUUID();
      const leadId = randomUUID();
      const travelIdeaId = randomUUID();
      const interactionId = randomUUID();
      const taskId = randomUUID();
      const agentRunId = randomUUID();
      const nowActor = context.actor ?? 'public_lead_api';
      const userId = context.userId ?? null;
      const intakeOutput = createIntakeAgentStubOutput(submission);

      await client.query(
        `insert into travelgtc_contacts (
          id, user_id, display_name, primary_channel, primary_contact, email, phone, telegram, max_contact, whatsapp,
          consent_personal_data, consent_communication, consent_version, created_by, updated_by
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,true,$11,$12,$12)`,
        [
          contactId,
          userId,
          submission.name,
          submission.preferred_channel,
          submission.contact_value,
          submission.preferred_channel === 'email' ? submission.contact_value : null,
          submission.preferred_channel === 'phone' ? submission.contact_value : null,
          submission.preferred_channel === 'telegram' ? submission.contact_value : null,
          submission.preferred_channel === 'max' ? submission.contact_value : null,
          submission.preferred_channel === 'whatsapp' ? submission.contact_value : null,
          submission.consent_version,
          nowActor,
        ],
      );

      await client.query(
        `insert into travelgtc_leads (
          id, contact_id, user_id, stage, declared_role, inferred_role, primary_interest, business_interest_level,
          source_channel, source_path, referrer, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          referral_code, locale, timezone, client_event_id, recommended_next_step, summary, compliance_risk,
          created_by, updated_by
        ) values ($1,$2,$3,'new_lead',$4,$4,$5,$6,'site',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$21)`,
        [
          leadId,
          contactId,
          userId,
          submission.declared_role,
          submission.primary_interest,
          submission.business_interest_level ?? 'none',
          submission.tracking.landing_path ?? null,
          submission.tracking.referrer ?? null,
          submission.tracking.utm_source ?? null,
          submission.tracking.utm_medium ?? null,
          submission.tracking.utm_campaign ?? null,
          submission.tracking.utm_content ?? null,
          submission.tracking.utm_term ?? null,
          submission.tracking.referral_code ?? null,
          submission.tracking.locale ?? null,
          submission.tracking.timezone ?? null,
          clientEventId,
          intakeOutput.recommended_next_step,
          intakeOutput.summary,
          intakeOutput.risk_flags.income_claim || intakeOutput.risk_flags.pressure_language ? 'medium' : 'none',
          nowActor,
        ],
      );

      await client.query(
        `insert into travelgtc_travel_ideas (
          id, lead_id, created_by_user_id, format, destination, approx_dates, audience_type, estimated_group_size,
          description, important_details, status, created_by, updated_by
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'needs_review',$11,$11)`,
        [
          travelIdeaId,
          leadId,
          userId,
          submission.travel_format?.join(', ') ?? null,
          submission.destination_interest ?? null,
          submission.approx_dates ?? null,
          submission.audience_type?.join(', ') ?? null,
          submission.estimated_group_size ?? null,
          submission.message,
          submission.important_details ?? submission.best_contact_time ?? null,
          nowActor,
        ],
      );

      await client.query(
        `insert into travelgtc_interactions (
          id, lead_id, contact_id, actor_user_id, interaction_type, channel, direction, body, human_approved, metadata_json,
          created_by, updated_by
        ) values ($1,$2,$3,$4,'form','site','inbound',$5,null,$6,$7,$7)`,
        [
          interactionId,
          leadId,
          contactId,
          userId,
          submission.message,
          JSON.stringify({ source: 'public_lead_api', tracking: submission.tracking }),
          nowActor,
        ],
      );

      await client.query(
        `insert into travelgtc_tasks (
          id, lead_id, task_type, title, description, status, priority, created_by, updated_by
        ) values ($1,$2,'review','Проверить новую заявку TravelGTC',$3,'open','normal',$4,$4)`,
        [taskId, leadId, intakeOutput.recommended_next_step, nowActor],
      );

      await client.query(
        `insert into travelgtc_agent_runs (
          id, lead_id, agent_type, input_json, output_json, status, model_name, risk_flags_json,
          human_review_status, created_by, updated_by
        ) values ($1,$2,'intake',$3,$4,'completed','stub',$5,'pending',$6,$6)`,
        [
          agentRunId,
          leadId,
          JSON.stringify({
            lead_id: leadId,
            source_path: submission.tracking.landing_path,
            declared_role: submission.declared_role,
            primary_interest: submission.primary_interest,
            message: submission.message,
            travel_idea: {
              format: submission.travel_format,
              destination: submission.destination_interest,
              audience_type: submission.audience_type,
              estimated_group_size: submission.estimated_group_size,
            },
            business_interest_level: submission.business_interest_level,
            consent_version: submission.consent_version,
          }),
          JSON.stringify(intakeOutput),
          JSON.stringify(intakeOutput.risk_flags),
          nowActor,
        ],
      );

      await insertAudit(client, userId, 'lead', leadId, 'created', {
        stage: 'new_lead',
        declared_role: submission.declared_role,
        primary_interest: submission.primary_interest,
      });
      await insertAudit(client, userId, 'contact', contactId, 'consent_recorded', {
        consent_personal_data: true,
        consent_communication: true,
        consent_version: submission.consent_version,
      });
      await insertAudit(client, userId, 'agent_run', agentRunId, 'agent_run', intakeOutput);

      await client.query('commit');

      return {
        contactId,
        leadId,
        travelIdeaId,
        interactionId,
        taskId,
        agentRunId,
        stage: 'new_lead',
      };
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

async function insertAudit(
  client: pg.PoolClient,
  actorUserId: string | null,
  entityType: string,
  entityId: string,
  action: string,
  after: unknown,
) {
  await client.query(
    `insert into travelgtc_audit_log (
      id, entity_type, entity_id, action, actor_type, actor_id, actor_user_id, after_json, created_by, updated_by
    ) values ($1,$2,$3,$4,'system','public_lead_api',$5,$6,'public_lead_api','public_lead_api')`,
    [randomUUID(), entityType, entityId, action, actorUserId, JSON.stringify(after)],
  );
}
