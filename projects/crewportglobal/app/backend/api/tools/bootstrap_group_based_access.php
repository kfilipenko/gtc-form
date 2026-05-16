<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/bootstrap.php';

const CPG_GROUP_ACCESS_DEFAULT_OWNER_EMAIL = 'kfilipenko@gtchain.io';
const CPG_GROUP_ACCESS_OWNERS_GROUP_CODE = 'owners';
const CPG_GROUP_ACCESS_OWNERS_GROUP_NAME = 'Владельцы';
const CPG_GROUP_ACCESS_OWNERS_GROUP_EMAIL = 'owners@gtchain.io';
const CPG_GROUP_ACCESS_TEAM_GROUP_CODE = 'cpg_team';
const CPG_GROUP_ACCESS_TEAM_GROUP_NAME = 'Команда CPG';
const CPG_GROUP_ACCESS_TEAM_GROUP_EMAIL = 'cpg-team@gtchain.io';
const CPG_GROUP_ACCESS_PROJECT_OWNER_ROLE = 'project_owner';
const CPG_GROUP_ACCESS_LEGACY_PLATFORM_OWNERS_GROUP = 'platform_owners';

function cpg_group_access_json(array $payload, int $exitCode): never {
    fwrite(STDOUT, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . PHP_EOL);
    exit($exitCode);
}

function cpg_group_access_first(string $sql, array $params = []): ?array {
    $result = api_query($sql, $params);
    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function cpg_group_access_ensure_group(
    string $groupCode,
    string $groupName,
    string $groupType,
    string $description
): array {
    $row = cpg_group_access_first(
        'INSERT INTO crewportglobal.access_groups
           (group_code, group_name, group_type, description, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, TRUE, now(), now())
         ON CONFLICT (group_code) DO UPDATE
           SET group_name = EXCLUDED.group_name,
               group_type = EXCLUDED.group_type,
               description = EXCLUDED.description,
               is_active = TRUE,
               updated_at = now()
         RETURNING group_id::text, group_code, group_name, group_type, description, is_active',
        [$groupCode, $groupName, $groupType, $description]
    );

    if ($row === null) {
        throw new RuntimeException("Unable to ensure group {$groupCode}");
    }

    return $row;
}

function cpg_group_access_ensure_active_group_role(
    string $groupId,
    string $roleId,
    string $actorUserId,
    string $reason
): bool {
    $existing = cpg_group_access_first(
        'SELECT group_role_id::text
         FROM crewportglobal.access_group_roles
         WHERE group_id = $1::uuid
           AND role_id = $2::uuid
           AND assignment_state = $3
         LIMIT 1',
        [$groupId, $roleId, 'active']
    );
    if ($existing !== null) {
        return false;
    }

    api_query(
        'INSERT INTO crewportglobal.access_group_roles
           (group_id, role_id, assignment_state, granted_by_user_id, granted_at, reason, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3, $4::uuid, now(), $5, now(), now())',
        [$groupId, $roleId, 'active', $actorUserId, $reason]
    );

    return true;
}

function cpg_group_access_ensure_active_membership(
    string $groupId,
    string $userId,
    string $actorUserId,
    string $reason
): bool {
    $existing = cpg_group_access_first(
        'SELECT group_member_id::text
         FROM crewportglobal.access_group_members
         WHERE group_id = $1::uuid
           AND user_id = $2::uuid
           AND membership_state = $3
         LIMIT 1',
        [$groupId, $userId, 'active']
    );
    if ($existing !== null) {
        return false;
    }

    api_query(
        'INSERT INTO crewportglobal.access_group_members
           (group_id, user_id, membership_state, granted_by_user_id, granted_at, reason, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3, $4::uuid, now(), $5, now(), now())',
        [$groupId, $userId, 'active', $actorUserId, $reason]
    );

    return true;
}

function cpg_group_access_revoke_legacy_owner_membership(string $ownerUserId): int {
    $result = api_query(
        'UPDATE crewportglobal.access_group_members gm
         SET membership_state = $3,
             revoked_by_user_id = $1::uuid,
             revoked_at = now(),
             reason = $4,
             updated_at = now()
         FROM crewportglobal.access_groups g
         WHERE g.group_id = gm.group_id
           AND g.group_code = $2
           AND gm.user_id = $1::uuid
           AND gm.membership_state = $5
         RETURNING gm.group_member_id',
        [
            $ownerUserId,
            CPG_GROUP_ACCESS_LEGACY_PLATFORM_OWNERS_GROUP,
            'revoked',
            'Replaced by owners group membership for group-based access issue #10.',
            'active',
        ]
    );

    return pg_num_rows($result);
}

$options = getopt('', ['owner-email::']);
$ownerEmail = api_normalize_email($options['owner-email'] ?? CPG_GROUP_ACCESS_DEFAULT_OWNER_EMAIL);
if ($ownerEmail === null) {
    cpg_group_access_json([
        'ok' => false,
        'error' => 'owner_email_invalid',
    ], 1);
}

api_tx_begin();
try {
    $owner = cpg_group_access_first(
        'SELECT user_id::text, lower(email) AS email
         FROM crewportglobal.users
         WHERE lower(email) = lower($1)
         LIMIT 1',
        [$ownerEmail]
    );
    if ($owner === null) {
        throw new RuntimeException('Owner user must exist before group bootstrap');
    }

    $ownerUserId = (string) $owner['user_id'];
    $role = cpg_group_access_first(
        'SELECT role_id::text, role_code
         FROM crewportglobal.access_roles
         WHERE role_code = $1
           AND is_active = TRUE
         LIMIT 1',
        [CPG_GROUP_ACCESS_PROJECT_OWNER_ROLE]
    );
    if ($role === null) {
        throw new RuntimeException('project_owner role is missing');
    }

    $ownersGroup = cpg_group_access_ensure_group(
        CPG_GROUP_ACCESS_OWNERS_GROUP_CODE,
        CPG_GROUP_ACCESS_OWNERS_GROUP_NAME,
        'administration',
        'Display name: Владельцы. Recommended group email: owners@gtchain.io. Purpose: owner/admin access group.'
    );
    $teamGroup = cpg_group_access_ensure_group(
        CPG_GROUP_ACCESS_TEAM_GROUP_CODE,
        CPG_GROUP_ACCESS_TEAM_GROUP_NAME,
        'internal',
        'Display name: Команда CPG. Recommended group email: cpg-team@gtchain.io. Purpose: CrewPortGlobal team access group. Members require Project Owner approval.'
    );

    $groupRoleCreated = cpg_group_access_ensure_active_group_role(
        (string) $ownersGroup['group_id'],
        (string) $role['role_id'],
        $ownerUserId,
        'Issue #10 group-based access bootstrap: owners group carries project_owner role.'
    );
    $ownerMembershipCreated = cpg_group_access_ensure_active_membership(
        (string) $ownersGroup['group_id'],
        $ownerUserId,
        $ownerUserId,
        'Issue #10 group-based access bootstrap: first owner belongs to owners group.'
    );
    $legacyRevokedCount = cpg_group_access_revoke_legacy_owner_membership($ownerUserId);

    api_query(
        'INSERT INTO crewportglobal.access_audit_events
           (actor_user_id, event_type, target_user_id, target_group_id, target_role_id,
            previous_value, new_value, reason, user_agent, created_at)
         VALUES ($1::uuid, $2, $1::uuid, $3::uuid, $4::uuid, $5::jsonb, $6::jsonb, $7, $8, now())',
        [
            $ownerUserId,
            'group_based_access_bootstrap_completed',
            (string) $ownersGroup['group_id'],
            (string) $role['role_id'],
            json_encode([
                'legacy_group_code' => CPG_GROUP_ACCESS_LEGACY_PLATFORM_OWNERS_GROUP,
                'legacy_owner_memberships_revoked' => $legacyRevokedCount,
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            json_encode([
                'owner_email' => $ownerEmail,
                'owners_group_code' => CPG_GROUP_ACCESS_OWNERS_GROUP_CODE,
                'owners_group_email' => CPG_GROUP_ACCESS_OWNERS_GROUP_EMAIL,
                'team_group_code' => CPG_GROUP_ACCESS_TEAM_GROUP_CODE,
                'team_group_email' => CPG_GROUP_ACCESS_TEAM_GROUP_EMAIL,
                'role_code' => CPG_GROUP_ACCESS_PROJECT_OWNER_ROLE,
                'group_role_created' => $groupRoleCreated,
                'owner_membership_created' => $ownerMembershipCreated,
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'Issue #10 group-based owner/admin access bootstrap.',
            'cpg-bootstrap-group-based-access-cli',
        ]
    );

    api_tx_commit();

    cpg_group_access_json([
        'ok' => true,
        'owner_email' => $ownerEmail,
        'owners_group' => [
            'group_code' => CPG_GROUP_ACCESS_OWNERS_GROUP_CODE,
            'group_name' => CPG_GROUP_ACCESS_OWNERS_GROUP_NAME,
            'group_email' => CPG_GROUP_ACCESS_OWNERS_GROUP_EMAIL,
            'member_email' => $ownerEmail,
            'role_code' => CPG_GROUP_ACCESS_PROJECT_OWNER_ROLE,
        ],
        'team_group' => [
            'group_code' => CPG_GROUP_ACCESS_TEAM_GROUP_CODE,
            'group_name' => CPG_GROUP_ACCESS_TEAM_GROUP_NAME,
            'group_email' => CPG_GROUP_ACCESS_TEAM_GROUP_EMAIL,
            'members_added' => 0,
        ],
        'legacy_platform_owners_memberships_revoked' => $legacyRevokedCount,
        'audit_event' => 'group_based_access_bootstrap_completed',
    ], 0);
} catch (Throwable $error) {
    api_tx_rollback();
    cpg_group_access_json([
        'ok' => false,
        'error' => 'group_based_access_bootstrap_failed',
        'message' => $error->getMessage(),
    ], 1);
}
