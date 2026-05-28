<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/shared/auth.php';

require_login();

$pageTitle = APP_NAME;
$activeApp = 'dashboard';
$apps = [
    ['name' => 'Cost Manager', 'desc' => 'track your margins and profitability', 'icon' => 'circle-dollar-sign', 'href' => BASE_URL . '/apps/cost-manager/index.php', 'active' => true, 'tone' => 'pink'],
    ['name' => 'Inventory', 'desc' => 'stock levels and reorder alerts', 'icon' => 'package', 'href' => BASE_URL . '/apps/inventory/index.php', 'active' => false, 'tone' => 'peach'],
    ['name' => 'Formulator', 'desc' => 'create and manage recipes', 'icon' => 'bot', 'href' => BASE_URL . '/apps/formulator/index.php', 'active' => false, 'tone' => 'blue'],
    ['name' => 'VAT Tracker', 'desc' => 'calculate and track returns', 'icon' => 'tablet', 'href' => BASE_URL . '/apps/vat-tracker/index.php', 'active' => false, 'tone' => 'violet'],
    ['name' => 'Transport', 'desc' => 'extract weight from courier invoices', 'icon' => 'truck', 'href' => BASE_URL . '/apps/cost-manager/transport.php', 'active' => false, 'tone' => 'rose'],
    ['name' => 'Analytics', 'desc' => 'revenue trends and insights', 'icon' => 'bar-chart-3', 'href' => '#', 'active' => false, 'tone' => 'blue'],
    ['name' => 'Orders', 'desc' => 'process and track orders', 'icon' => 'shopping-cart', 'href' => '#', 'active' => false, 'tone' => 'peach'],
    ['name' => 'Settings', 'desc' => 'configure portal and users', 'icon' => 'settings', 'href' => '#', 'active' => false, 'tone' => 'grey'],
];

include __DIR__ . '/shared/header.php';
include __DIR__ . '/shared/sidebar.php';
?>
<main class="workspace launcher">
    <section class="launcher-hero" aria-labelledby="launcher-title">
        <h1 id="launcher-title">essentials <span class="mascot" aria-hidden="true">&#9822;</span></h1>
        <p>your business command center</p>
    </section>

    <section class="app-grid" aria-label="Business apps">
        <?php foreach ($apps as $app): ?>
            <?php $tag = $app['active'] ? 'a' : 'div'; ?>
            <<?= $tag ?> class="app-card <?= $app['active'] ? 'is-active' : 'is-muted' ?>" <?= $app['active'] ? 'href="' . htmlspecialchars($app['href'], ENT_QUOTES, 'UTF-8') . '"' : '' ?>>
                <?php if (!$app['active']): ?><span class="soon">Soon</span><?php endif; ?>
                <span class="app-icon <?= htmlspecialchars($app['tone'], ENT_QUOTES, 'UTF-8') ?>">
                    <i data-lucide="<?= htmlspecialchars($app['icon'], ENT_QUOTES, 'UTF-8') ?>"></i>
                </span>
                <strong><?= htmlspecialchars($app['name'], ENT_QUOTES, 'UTF-8') ?></strong>
                <small><?= htmlspecialchars($app['desc'], ENT_QUOTES, 'UTF-8') ?></small>
            </<?= $tag ?>>
        <?php endforeach; ?>
    </section>
</main>
<?php include __DIR__ . '/shared/footer.php'; ?>
