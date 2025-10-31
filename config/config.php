<?php

declare(strict_types=1);

/**
 * Global configuration helpers.
 */

define('APP_NAME', 'Cálculo Judiciário');
define('BASE_PATH', dirname(__DIR__));

// Fallback desejado em ambiente local
define('APP_BASE_URL_FALLBACK', 'http://127.0.0.1:8080');

/**
 * Detects the base URL automatically when possible.
 * Priority: APP_BASE_URL env > server detection > fallback.
 */
function app_base_url(): string
{
    $envBase = getenv('APP_BASE_URL');
    if (!empty($envBase)) {
        return rtrim($envBase, '/');
    }

    // Detecta domínio em Vercel
    $vercelUrl = getenv('VERCEL_URL'); // ex: my-app.vercel.app
    if (!empty($vercelUrl)) {
        $scheme = 'https';
        return $scheme . '://' . rtrim($vercelUrl, '/');
    }

    // If running without web server context (e.g., CLI), use fallback
    if (empty($_SERVER['HTTP_HOST'])) {
        return rtrim(APP_BASE_URL_FALLBACK, '/');
    }

    // Scheme detection (supports reverse proxies)
    $scheme = 'http';
    if (
        (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower((string)$_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https') ||
        (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off') ||
        (!empty($_SERVER['SERVER_PORT']) && (string)$_SERVER['SERVER_PORT'] === '443')
    ) {
        $scheme = 'https';
    }

    $host = (string)($_SERVER['HTTP_HOST'] ?? '127.0.0.1:8080');
    $scriptName = (string)($_SERVER['SCRIPT_NAME'] ?? '');
    $baseDir = rtrim(str_replace('\\', '/', dirname($scriptName)), '/');

    $url = sprintf('%s://%s%s', $scheme, $host, $baseDir === '/' ? '' : $baseDir);

    return rtrim($url, '/');
}

/**
 * Simple redirect helper.
 */
function redirect(string $route, array $params = []): void
{
    $query = !empty($params) ? '&' . http_build_query($params) : '';
    header('Location: ' . app_base_url() . '/index.php?route=' . urlencode($route) . $query);
    exit;
}

/**
 * Sanitizes output for safe HTML rendering.
 */
function e(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}
