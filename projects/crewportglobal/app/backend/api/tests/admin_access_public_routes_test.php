<?php

declare(strict_types=1);

function cpg_admin_public_routes_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

function cpg_admin_public_routes_extract_function(string $source, string $functionName): string {
    $pattern = '/function\s+' . preg_quote($functionName, '/') . '\s*\([^)]*\)\s*:\s*void\s*\{(?P<body>.*?)\n\}/s';
    if (preg_match($pattern, $source, $matches) !== 1) {
        return '';
    }

    return (string) $matches['body'];
}

$indexPath = __DIR__ . '/../public/index.php';
$source = file_get_contents($indexPath);
cpg_admin_public_routes_test_assert(is_string($source), 'public index should be readable');

$requiredFragments = [
    "require_once __DIR__ . '/../lib/admin_access_flow.php';",
    "require_once __DIR__ . '/../lib/admin_access_email_delivery.php';",
    "require_once __DIR__ . '/../lib/admin_access_storage_factory.php';",
    "const ADMIN_ACCESS_PUBLIC_ROUTES_ENV = 'CREWPORTGLOBAL_ADMIN_ACCESS_PUBLIC_ROUTES_ENABLED';",
    'function admin_access_load_runtime_env(): void',
    'function admin_access_session_token(): ?string',
    'function admin_access_storage_or_response(): CpgAdminAccessStorage',
    'function admin_access_public_routes_enabled(): bool',
    'function admin_access_public_flow_enabled(): bool',
    'function handle_post_admin_access_email_code_request(): void',
    'function handle_post_admin_access_email_code_verify(): void',
    'function handle_get_admin_access_session(): void',
    'function handle_post_admin_access_session_revoke(): void',
    'function handle_get_admin_access_team_links(): void',
    "\$path === '/admin/access/email-code/request'",
    "\$path === '/admin/access/email-code/verify'",
    "\$path === '/admin/access/session'",
    "\$path === '/admin/access/session/revoke'",
    "\$path === '/admin/access/team-links'",
    'cpg_admin_access_disabled_response()',
];

foreach ($requiredFragments as $fragment) {
    cpg_admin_public_routes_test_assert(
        str_contains($source, $fragment),
        "public admin route wiring is missing fragment: {$fragment}"
    );
}

$requestHandler = cpg_admin_public_routes_extract_function($source, 'handle_post_admin_access_email_code_request');
$verifyHandler = cpg_admin_public_routes_extract_function($source, 'handle_post_admin_access_email_code_verify');
$sessionHandler = cpg_admin_public_routes_extract_function($source, 'handle_get_admin_access_session');
$revokeHandler = cpg_admin_public_routes_extract_function($source, 'handle_post_admin_access_session_revoke');
$teamLinksHandler = cpg_admin_public_routes_extract_function($source, 'handle_get_admin_access_team_links');
cpg_admin_public_routes_test_assert($requestHandler !== '', 'request handler should be extractable');
cpg_admin_public_routes_test_assert($verifyHandler !== '', 'verify handler should be extractable');
cpg_admin_public_routes_test_assert($sessionHandler !== '', 'session handler should be extractable');
cpg_admin_public_routes_test_assert($revokeHandler !== '', 'revoke handler should be extractable');
cpg_admin_public_routes_test_assert($teamLinksHandler !== '', 'team links handler should be extractable');

foreach ([
    'request' => $requestHandler,
    'verify' => $verifyHandler,
    'session' => $sessionHandler,
    'revoke' => $revokeHandler,
    'team-links' => $teamLinksHandler,
] as $name => $handlerSource) {
    $disabledPos = strpos($handlerSource, 'cpg_admin_access_disabled_response()');
    $decodePos = strpos($handlerSource, 'api_decode_json_body()');
    cpg_admin_public_routes_test_assert(
        $disabledPos !== false,
        "{$name} handler should return disabled response before runtime work"
    );
    cpg_admin_public_routes_test_assert(
        str_contains($handlerSource, 'admin_access_load_runtime_env()'),
        "{$name} handler should load protected runtime env before checking feature flags"
    );
    if ($decodePos !== false) {
        cpg_admin_public_routes_test_assert(
            $disabledPos < $decodePos,
            "{$name} handler should return disabled response before reading JSON"
        );
        cpg_admin_public_routes_test_assert(
            !str_contains(substr($handlerSource, 0, (int) $disabledPos), 'api_decode_json_body()'),
            "{$name} handler must not read request JSON before the disabled boundary"
        );
    }
}

cpg_admin_public_routes_test_assert(
    str_contains($requestHandler, 'admin_access_storage_or_response()')
        && str_contains($requestHandler, 'cpg_admin_access_create_email_delivery()')
        && str_contains($requestHandler, 'cpg_admin_access_request_code_with_storage_and_delivery('),
    'request handler should wire storage and delivery after runtime gates'
);

cpg_admin_public_routes_test_assert(
    str_contains($verifyHandler, 'admin_access_storage_or_response()')
        && str_contains($verifyHandler, 'cpg_admin_access_verify_code_with_storage('),
    'verify handler should wire storage after runtime gates'
);
cpg_admin_public_routes_test_assert(
    str_contains($sessionHandler, 'cpg_admin_access_session_summary_with_storage(')
        && str_contains($sessionHandler, 'admin_access_session_token()'),
    'session handler should return console summary from session token'
);
cpg_admin_public_routes_test_assert(
    str_contains($revokeHandler, 'cpg_admin_access_revoke_session_with_storage(')
        && str_contains($revokeHandler, 'admin_access_session_token()'),
    'revoke handler should revoke the current admin session token'
);
cpg_admin_public_routes_test_assert(
    str_contains($teamLinksHandler, 'cpg_admin_access_team_links_with_storage(')
        && str_contains($teamLinksHandler, 'admin_access_session_token()'),
    'team links handler should protect links behind a verified group session'
);

fwrite(STDOUT, "Admin access public route wiring tests passed\n");
