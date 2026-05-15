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
    "const ADMIN_ACCESS_PUBLIC_ROUTES_ENV = 'CREWPORTGLOBAL_ADMIN_ACCESS_PUBLIC_ROUTES_ENABLED';",
    'function admin_access_public_routes_enabled(): bool',
    'function admin_access_public_flow_enabled(): bool',
    'function handle_post_admin_access_email_code_request(): void',
    'function handle_post_admin_access_email_code_verify(): void',
    "\$path === '/admin/access/email-code/request'",
    "\$path === '/admin/access/email-code/verify'",
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
cpg_admin_public_routes_test_assert($requestHandler !== '', 'request handler should be extractable');
cpg_admin_public_routes_test_assert($verifyHandler !== '', 'verify handler should be extractable');

foreach ([
    'request' => $requestHandler,
    'verify' => $verifyHandler,
] as $name => $handlerSource) {
    $disabledPos = strpos($handlerSource, 'cpg_admin_access_disabled_response()');
    $decodePos = strpos($handlerSource, 'api_decode_json_body()');
    cpg_admin_public_routes_test_assert(
        $disabledPos !== false && $decodePos !== false && $disabledPos < $decodePos,
        "{$name} handler should return disabled response before reading JSON"
    );
    cpg_admin_public_routes_test_assert(!str_contains($handlerSource, 'api_query('), "{$name} handler must not query DB");
    cpg_admin_public_routes_test_assert(!str_contains($handlerSource, 'api_db('), "{$name} handler must not open DB");
    cpg_admin_public_routes_test_assert(!str_contains($handlerSource, 'CpgAdminAccessPgStorage'), "{$name} handler must not wire PG storage");
}

cpg_admin_public_routes_test_assert(
    !str_contains($source, "require_once __DIR__ . '/../lib/admin_access_pg_storage.php';"),
    'public index must not include PostgreSQL admin access storage yet'
);

fwrite(STDOUT, "Admin access public route wiring tests passed\n");
