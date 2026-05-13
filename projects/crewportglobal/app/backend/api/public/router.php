<?php

declare(strict_types=1);

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$publicRoot = __DIR__;

$targetPath = realpath($publicRoot . $requestUri);
if ($targetPath !== false && str_starts_with($targetPath, $publicRoot) && is_file($targetPath)) {
    return false;
}

require $publicRoot . '/index.php';
return true;
