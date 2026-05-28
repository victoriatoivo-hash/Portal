<?php

declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

function current_user(): array
{
    if (!isset($_SESSION['user'])) {
        $_SESSION['user'] = [
            'name' => 'Victoria Toivo',
            'role' => 'Admin',
        ];
    }

    return $_SESSION['user'];
}

function require_login(): void
{
    current_user();
}

function logout_user(): void
{
    $_SESSION = [];
    session_destroy();
}

