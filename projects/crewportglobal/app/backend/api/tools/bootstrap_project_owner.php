#!/usr/bin/env php
<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/bootstrap.php';

const CPG_BOOTSTRAP_SMTP_SENDER_EMAIL = 'not_reply@crewportglobal.com';
const CPG_BOOTSTRAP_PLATFORM_OWNER_GROUP = 'platform_owners';
const CPG_BOOTSTRAP_PROJECT_OWNER_ROLE = 'project_owner';

function cpg_bootstrap_json(array $payload, int $exitCode = 0): never {
    fwrite(STDOUT, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
    exit($exitCode);
}

function cpg_bootstrap_fetch_one(string $sql, array $params = []): ?array {
    $result = api_query($sql, $params);
    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

$options = getopt('', ['owner-email:']);
if (!is_array($options)) {
    cpg_bootstrap_json([
        'ok' => false,
        'error' => 'invalid_options',
    ], 2);
}

$ownerEmail = api_normalize_email($options['owner-email'] ?? null);
if ($ownerEmail === null) {
    cpg_bootstrap_json([
        'ok' => false,
        'error' => 'owner_email_required',
    ], 2);
}

if ($ownerEmail === CPG_BOOTSTRAP_SMTP_SENDER_EMAIL) {
    cpg_bootstrap_json([
        'ok' => false,
        'error' => 'smtp_sender_cannot_be_project_owner',
    ], 2);
}

api_tx_begin();

try {
    $existingUser = cpg_bootstrap_fetch_one(
        'SELECT user_id FROM crewportglobal.users WHERE lower(email) = lower($1) FOR UPDATE',
        [$ownerEmail]
    );

    $userCreated = false;
    if ($existingUser === null) {
        $inserted = cpg_bootstrap_fetch_one(
            "INSERT INTO crewportglobal.users (
                email,
                display_name,
                email_verified_at,
                registration_status,
                is_active
            )
            VALUES ($1, $2, now(), 'approved', true)
            RETURNING user_id",
            [$ownerEmail, 'CrewPortGlobal Project Owner']
        );
        $userId = (string) ($inserted['user_id'] ?? '');
        $userCreated = true;
    } else {
        $userId = (string) $existingUser['user_id'];
        api_query(
            "UPDATE crewportglobal.users
             SET email = lower($1),
                 display_name = COALESCE(NULLIF(display_name, ''), $2),
                 email_verified_at = COALESCE(email_verified_at, now()),
                 registration_status = 'approved',
                 is_active = true,
                 updated_at = now()
             WHERE user_id = $3",
            [$ownerEmail, 'CrewPortGlobal Project Owner', $userId]
        );
    }

    if ($userId === '') {
        throw new RuntimeException('Project owner user_id was not created');
    }

    api_query(
        "INSERT INTO crewportglobal.user_auth_identities (
            user_id,
            provider,
            provider_subject,
            is_primary
        )
        VALUES ($1, 'email', lower($2), true)
        ON CONFLICT (user_id, provider) DO UPDATE SET
            provider_subject = EXCLUDED.provider_subject,
            is_primary = true,
            updated_at = now()",
        [$userId, $ownerEmail]
    );

    $group = cpg_bootstrap_fetch_one(
        'SELECT group_id FROM crewportglobal.access_groups WHERE group_code = $1 AND is_active = true',
        [CPG_BOOTSTRAP_PLATFORM_OWNER_GROUP]
    );
    $role = cpg_bootstrap_fetch_one(
        'SELECT role_id FROM crewportglobal.access_roles WHERE role_code = $1 AND is_active = true',
        [CPG_BOOTSTRAP_PROJECT_OWNER_ROLE]
    );

    if ($group === null || $role === null) {
        throw new RuntimeException('Project owner group or role is missing');
    }

    $groupId = (string) $group['group_id'];
    $roleId = (string) $role['role_id'];

    $groupRole = cpg_bootstrap_fetch_one(
        "SELECT group_role_id
         FROM crewportglobal.access_group_roles
         WHERE group_id = $1
           AND role_id = $2
           AND assignment_state = 'active'",
        [$groupId, $roleId]
    );
    if ($groupRole === null) {
        api_query(
            "INSERT INTO crewportglobal.access_group_roles (
                group_id,
                role_id,
                assignment_state,
                granted_by_user_id,
                reason
            )
            VALUES ($1, $2, 'active', $3, $4)",
            [$groupId, $roleId, $userId, 'Controlled bootstrap: platform_owners must carry project_owner role']
        );
    }

    api_query(
        "INSERT INTO crewportglobal.access_group_members (
            group_id,
            user_id,
            membership_state,
            granted_by_user_id,
            reason
        )
        VALUES ($1, $2, 'active', $2, $3)
        ON CONFLICT (group_id, user_id) WHERE membership_state = 'active' DO UPDATE SET
            granted_by_user_id = EXCLUDED.granted_by_user_id,
            reason = EXCLUDED.reason,
            updated_at = now()",
        [$groupId, $userId, 'Controlled bootstrap: first CrewPortGlobal Project Owner']
    );

    $auditPayload = [
        'owner_email' => $ownerEmail,
        'group_code' => CPG_BOOTSTRAP_PLATFORM_OWNER_GROUP,
        'role_code' => CPG_BOOTSTRAP_PROJECT_OWNER_ROLE,
        'smtp_sender_email' => CPG_BOOTSTRAP_SMTP_SENDER_EMAIL,
        'user_created' => $userCreated,
    ];

    api_query(
        "INSERT INTO crewportglobal.access_audit_events (
            actor_user_id,
            event_type,
            target_user_id,
            target_group_id,
            target_role_id,
            previous_value,
            new_value,
            reason,
            user_agent
        )
        VALUES ($1, 'project_owner_bootstrap_completed', $1, $2, $3, '{}'::jsonb, $4::jsonb, $5, $6)",
        [
            $userId,
            $groupId,
            $roleId,
            json_encode($auditPayload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
            'Controlled bootstrap of first CrewPortGlobal Project Owner',
            'cpg-bootstrap-project-owner-cli',
        ]
    );

    api_tx_commit();

    cpg_bootstrap_json([
        'ok' => true,
        'owner_email' => $ownerEmail,
        'user_id' => $userId,
        'user_created' => $userCreated,
        'group_code' => CPG_BOOTSTRAP_PLATFORM_OWNER_GROUP,
        'role_code' => CPG_BOOTSTRAP_PROJECT_OWNER_ROLE,
        'audit_event' => 'project_owner_bootstrap_completed',
        'smtp_sender_email' => CPG_BOOTSTRAP_SMTP_SENDER_EMAIL,
    ]);
} catch (Throwable $exception) {
    api_tx_rollback();

    cpg_bootstrap_json([
        'ok' => false,
        'error' => 'project_owner_bootstrap_failed',
        'message' => $exception->getMessage(),
    ], 1);
}
