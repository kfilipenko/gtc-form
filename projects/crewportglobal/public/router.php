<?php

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$publicRoot = __DIR__;

$targetPath = realpath($publicRoot . $requestUri);
if ($targetPath !== false && str_starts_with($targetPath, $publicRoot) && is_file($targetPath)) {
    return false;
}

$normalizedPath = rtrim($requestUri, '/');
if ($normalizedPath === '') {
    $normalizedPath = '/';
}

$directoryPath = $normalizedPath === '/' ? $publicRoot : $publicRoot . $normalizedPath;
$directoryRoot = rtrim($directoryPath, '/');
$indexHtml = $directoryRoot . '/index.html';
$indexMarkdown = $directoryRoot . '/index.md';

if (is_file($indexHtml)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($indexHtml);
    return true;
}

if (is_file($indexMarkdown)) {
    header('Content-Type: text/markdown; charset=UTF-8');
    readfile($indexMarkdown);
    return true;
}

http_response_code(404);
header('Content-Type: text/plain; charset=UTF-8');
echo 'Not Found';