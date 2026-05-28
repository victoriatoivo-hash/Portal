<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/shared/auth.php';

if (($_GET['action'] ?? '') === 'logout') {
    logout_user();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $_SESSION['user'] = [
        'name' => trim($_POST['name'] ?? 'Victoria Toivo') ?: 'Victoria Toivo',
        'role' => 'Admin',
    ];
    header('Location: index.php');
    exit;
}

$pageTitle = 'Login | ' . APP_NAME;
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="<?= BASE_URL ?>/assets/css/portal.css">
</head>
<body class="login-page">
    <main class="login-card">
        <p class="eyebrow">Hambelela Business Portal</p>
        <h1>Sign in</h1>
        <form method="post">
            <label for="name">Name</label>
            <input id="name" name="name" value="Victoria Toivo" autocomplete="name">
            <button type="submit">Continue</button>
        </form>
    </main>
</body>
</html>

