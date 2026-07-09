import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { AccountAlreadyExistsError, EmailVerificationTokenError, InvalidCredentialsError } from '../errors.js';
import { hashPassword, verifyPassword } from '../password.js';
import type { AuthStore } from '../authStore.js';
import type {
  AuthSession,
  EmailVerificationToken,
  GtcIdentityUser,
  LoginInput,
  ProjectMembership,
  RegisterInput,
  RequestMetadata,
  SessionLookupResult,
} from '../types.js';
import { hashToken } from './memoryAuthStore.js';

const { Pool } = pg;

export class PostgresAuthStore implements AuthStore {
  private readonly pool: pg.Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async createUser(input: RegisterInput, metadata: RequestMetadata): Promise<GtcIdentityUser> {
    const client = await this.pool.connect();
    const email = normalizeEmail(input.email);

    try {
      await client.query('begin');

      const existing = await client.query(
        'select user_id from travelgtc_identity.users where lower(email) = lower($1) limit 1',
        [email],
      );
      if (existing.rowCount) {
        throw new AccountAlreadyExistsError();
      }

      const userResult = await client.query<UserRow>(
        `insert into travelgtc_identity.users (email, phone, display_name, primary_channel, account_status)
         values ($1,$2,$3,$4,'pending_verification')
         returning user_id::text, email, phone, display_name, primary_channel, account_status,
                   email_verified_at::text, created_at::text`,
        [email, input.phone ?? null, input.displayName, input.primaryChannel],
      );
      const row = userResult.rows[0];

      await client.query(
        `insert into travelgtc_identity.user_credentials (user_id, login_email, password_hash)
         values ($1::uuid,$2,$3)`,
        [row.user_id, email, await hashPassword(input.password)],
      );

      await client.query(
        `insert into travelgtc_identity.user_consents
           (user_id, project_code, consent_type, consent_version, granted, source, ip_address, user_agent)
         values
           ($1::uuid,null,'identity_terms',$2,true,'travelgtc_auth_register',$3::inet,$4),
           ($1::uuid,null,'privacy_processing',$2,true,'travelgtc_auth_register',$3::inet,$4)`,
        [row.user_id, input.consentVersion, metadata.ipAddress ?? null, metadata.userAgent ?? null],
      );

      await insertAudit(client, row.user_id, 'user', row.user_id, 'identity_user_created', {
        source: 'travelgtc_auth_register',
        email,
      });

      await client.query('commit');
      return toPublicUser(row, []);
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async authenticate(input: LoginInput, _metadata: RequestMetadata): Promise<GtcIdentityUser> {
    const email = normalizeEmail(input.email);
    const result = await this.pool.query<UserCredentialRow>(
      `select u.user_id::text, u.email, u.phone, u.display_name, u.primary_channel, u.account_status,
              u.email_verified_at::text, u.created_at::text,
              c.password_hash, c.is_active
       from travelgtc_identity.user_credentials c
       join travelgtc_identity.users u on u.user_id = c.user_id
       where lower(c.login_email) = lower($1)
       limit 1`,
      [email],
    );

    const row = result.rows[0];
    const valid =
      row &&
      row.is_active &&
      row.account_status !== 'closed' &&
      row.account_status !== 'suspended' &&
      (await verifyPassword(input.password, row.password_hash));

    if (!valid) {
      if (row) {
        await this.pool.query(
          `update travelgtc_identity.user_credentials
           set failed_login_attempts = failed_login_attempts + 1,
               last_failed_login_at = now(),
               updated_at = now()
           where user_id = $1::uuid`,
          [row.user_id],
        );
      }
      throw new InvalidCredentialsError();
    }

    await this.pool.query(
      `update travelgtc_identity.user_credentials
       set failed_login_attempts = 0,
           last_login_at = now(),
           updated_at = now()
       where user_id = $1::uuid`,
      [row.user_id],
    );

    return toPublicUser(row, await this.membershipsForUser(row.user_id));
  }

  async createSession(userId: string, metadata: RequestMetadata, ttlSeconds: number): Promise<AuthSession> {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const result = await this.pool.query<{ session_id: string; expires_at: string }>(
      `insert into travelgtc_identity.user_sessions
         (user_id, session_token_hash, expires_at, ip_address, user_agent)
       values ($1::uuid,$2,$3::timestamptz,$4::inet,$5)
       returning session_id::text, expires_at::text`,
      [userId, tokenHash, expiresAt.toISOString(), metadata.ipAddress ?? null, metadata.userAgent ?? null],
    );

    const session = result.rows[0];
    const user = await this.userById(userId);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    return {
      sessionId: session.session_id,
      token,
      tokenHash,
      user,
      expiresAt: session.expires_at,
    };
  }

  async getSession(rawToken: string): Promise<SessionLookupResult | null> {
    const result = await this.pool.query<UserSessionRow>(
      `select s.session_id::text, s.expires_at::text,
              u.user_id::text, u.email, u.phone, u.display_name, u.primary_channel, u.account_status,
              u.email_verified_at::text, u.created_at::text
       from travelgtc_identity.user_sessions s
       join travelgtc_identity.users u on u.user_id = s.user_id
       where s.session_token_hash = $1
         and s.revoked_at is null
         and s.expires_at > now()
       limit 1`,
      [hashToken(rawToken)],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    await this.pool.query('update travelgtc_identity.user_sessions set last_used_at = now() where session_id = $1::uuid', [
      row.session_id,
    ]);

    return {
      sessionId: row.session_id,
      user: toPublicUser(row, await this.membershipsForUser(row.user_id)),
      expiresAt: row.expires_at,
    };
  }

  async revokeSession(rawToken: string): Promise<void> {
    await this.pool.query(
      `update travelgtc_identity.user_sessions
       set revoked_at = coalesce(revoked_at, now())
       where session_token_hash = $1`,
      [hashToken(rawToken)],
    );
  }

  async createEmailVerificationToken(
    userId: string,
    email: string,
    ttlSeconds: number,
    testMode: boolean,
  ): Promise<EmailVerificationToken> {
    const client = await this.pool.connect();
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    try {
      await client.query('begin');
      await client.query(
        `update travelgtc_identity.email_verification_tokens
         set token_state = 'revoked',
             updated_at = now()
         where user_id = $1::uuid
           and lower(email) = lower($2)
           and purpose = 'account_email_verification'
           and token_state = 'pending'`,
        [userId, email],
      );

      await client.query(
        `insert into travelgtc_identity.email_verification_tokens
           (user_id, email, verification_token_hash, purpose, token_state, expires_at, delivery_status)
         values ($1::uuid,$2,$3,'account_email_verification','pending',$4::timestamptz,$5)`,
        [
          userId,
          normalizeEmail(email),
          hashToken(token),
          expiresAt.toISOString(),
          testMode ? 'captured_test_only' : 'prepared_not_sent',
        ],
      );

      await insertAudit(client, userId, 'user', userId, 'email_verification_token_created', {
        delivery_status: testMode ? 'captured_test_only' : 'prepared_not_sent',
      });

      await client.query('commit');
      return {
        token,
        expiresAt: expiresAt.toISOString(),
        deliveryStatus: testMode ? 'captured_test_only' : 'prepared_not_sent',
      };
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async verifyEmailToken(rawToken: string): Promise<GtcIdentityUser> {
    const client = await this.pool.connect();

    try {
      await client.query('begin');
      const result = await client.query<{ token_id: string; user_id: string; email: string; expires_at: string }>(
        `select email_verification_token_id::text as token_id, user_id::text, email, expires_at::text
         from travelgtc_identity.email_verification_tokens
         where verification_token_hash = $1
           and purpose = 'account_email_verification'
           and token_state = 'pending'
         limit 1`,
        [hashToken(rawToken)],
      );

      const row = result.rows[0];
      if (!row) {
        throw new EmailVerificationTokenError('email_verification_token_invalid');
      }

      if (new Date(row.expires_at).getTime() <= Date.now()) {
        throw new EmailVerificationTokenError('email_verification_token_expired');
      }

      await client.query(
        `update travelgtc_identity.email_verification_tokens
         set token_state = 'used',
             used_at = now(),
             updated_at = now()
         where email_verification_token_id = $1::uuid`,
        [row.token_id],
      );

      await client.query(
        `update travelgtc_identity.users
         set email_verified_at = coalesce(email_verified_at, now()),
             account_status = case when account_status = 'pending_verification' then 'active' else account_status end,
             updated_at = now()
         where user_id = $1::uuid`,
        [row.user_id],
      );

      await insertAudit(client, row.user_id, 'user', row.user_id, 'email_verified', { email: row.email });
      await client.query('commit');

      const user = await this.userById(row.user_id);
      if (!user) {
        throw new EmailVerificationTokenError('email_verification_token_invalid');
      }
      return user;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async ensureProjectMembership(
    userId: string,
    projectCode: string,
    membershipStatus: string,
  ): Promise<ProjectMembership> {
    const result = await this.pool.query<{ project_code: string; membership_status: string }>(
      `insert into travelgtc_identity.user_project_memberships (user_id, project_code, membership_status)
       values ($1::uuid,$2,$3)
       on conflict (user_id, project_code)
       do update set membership_status = excluded.membership_status,
                     updated_at = now()
       returning project_code, membership_status`,
      [userId, projectCode, membershipStatus],
    );
    return {
      projectCode: result.rows[0].project_code,
      membershipStatus: result.rows[0].membership_status,
    };
  }

  async ensureProjectRole(userId: string, projectCode: string, roleCode: string, source: string): Promise<void> {
    await this.pool.query(
      `insert into travelgtc_identity.user_project_roles (user_id, project_code, role_code, source)
       values ($1::uuid,$2,$3,$4)
       on conflict (user_id, project_code, role_code)
       do update set source = excluded.source,
                     is_active = true,
                     updated_at = now()`,
      [userId, projectCode, roleCode, source],
    );
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async userById(userId: string): Promise<GtcIdentityUser | null> {
    const result = await this.pool.query<UserRow>(
      `select user_id::text, email, phone, display_name, primary_channel, account_status,
              email_verified_at::text, created_at::text
       from travelgtc_identity.users
       where user_id = $1::uuid
       limit 1`,
      [userId],
    );

    const row = result.rows[0];
    return row ? toPublicUser(row, await this.membershipsForUser(userId)) : null;
  }

  private async membershipsForUser(userId: string): Promise<ProjectMembership[]> {
    const result = await this.pool.query<{ project_code: string; membership_status: string }>(
      `select project_code, membership_status
       from travelgtc_identity.user_project_memberships
       where user_id = $1::uuid
       order by project_code`,
      [userId],
    );
    return result.rows.map((row) => ({
      projectCode: row.project_code,
      membershipStatus: row.membership_status,
    }));
  }
}

interface UserRow {
  user_id: string;
  email: string;
  phone: string | null;
  display_name: string;
  primary_channel: string;
  account_status: GtcIdentityUser['accountStatus'];
  email_verified_at: string | null;
  created_at: string;
}

interface UserCredentialRow extends UserRow {
  password_hash: string;
  is_active: boolean;
}

interface UserSessionRow extends UserRow {
  session_id: string;
  expires_at: string;
}

function toPublicUser(row: UserRow, memberships: ProjectMembership[]): GtcIdentityUser {
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    phone: row.phone ?? undefined,
    primaryChannel: row.primary_channel,
    accountStatus: row.account_status,
    emailVerified: row.email_verified_at !== null,
    emailVerifiedAt: row.email_verified_at ?? undefined,
    createdAt: row.created_at,
    projectMemberships: memberships,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function insertAudit(
  client: pg.PoolClient,
  actorUserId: string,
  entityType: string,
  entityId: string,
  action: string,
  after: unknown,
): Promise<void> {
  await client.query(
    `insert into travelgtc_identity.audit_events
       (actor_user_id, entity_type, entity_id, action, after_json, source)
     values ($1::uuid,$2,$3::uuid,$4,$5,$6)`,
    [actorUserId, entityType, entityId, action, JSON.stringify(after), 'travelgtc_auth_api'],
  );
}
