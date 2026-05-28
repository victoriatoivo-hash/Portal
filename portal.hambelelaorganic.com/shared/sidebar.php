<?php

declare(strict_types=1);

$navItems = [
    ['id' => 'dashboard', 'label' => 'Dashboard', 'icon' => 'layout-dashboard', 'href' => BASE_URL . '/index.php'],
    ['id' => 'cost-manager', 'label' => 'Cost Manager', 'icon' => 'circle-dollar-sign', 'href' => BASE_URL . '/apps/cost-manager/index.php'],
];
?>
<aside class="sidebar" aria-label="Portal navigation">
    <nav>
        <?php foreach ($navItems as $item): ?>
            <a class="<?= $activeApp === $item['id'] ? 'active' : '' ?>" href="<?= htmlspecialchars($item['href'], ENT_QUOTES, 'UTF-8') ?>">
                <i data-lucide="<?= htmlspecialchars($item['icon'], ENT_QUOTES, 'UTF-8') ?>"></i>
                <span><?= htmlspecialchars($item['label'], ENT_QUOTES, 'UTF-8') ?></span>
            </a>
        <?php endforeach; ?>
    </nav>
</aside>

