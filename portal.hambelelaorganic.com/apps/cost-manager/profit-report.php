<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config.php';
require_once BASE_PATH . '/shared/auth.php';

require_login();

$pageTitle = 'Profit Report | ' . APP_NAME;
$activeApp = 'cost-manager';

$rows = [
    ['product' => 'Castor Oil 500ml', 'price' => 128.00, 'cogs' => 73.40, 'profit' => 54.60, 'margin' => '42.7%'],
    ['product' => 'Shea Butter 250g', 'price' => 110.00, 'cogs' => 69.25, 'profit' => 40.75, 'margin' => '37.0%'],
    ['product' => 'Hibiscus 100g', 'price' => 58.00, 'cogs' => 24.80, 'profit' => 33.20, 'margin' => '57.2%'],
];

include BASE_PATH . '/shared/header.php';
include BASE_PATH . '/shared/sidebar.php';
?>
<main class="workspace module">
    <section class="module-header">
        <div>
            <p class="eyebrow">Dashboard</p>
            <h1>Profit report</h1>
            <p>WooCommerce sales feed into this report. Each product sale is matched against a recipe to calculate COGS and gross profit per unit.</p>
        </div>
    </section>

    <section class="report-grid">
        <article class="panel">
            <table class="data-table">
                <thead><tr><th>Product</th><th>Selling price</th><th>COGS</th><th>Gross profit</th><th>Margin</th></tr></thead>
                <tbody>
                    <?php foreach ($rows as $row): ?>
                        <tr>
                            <td><?= htmlspecialchars($row['product'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td>N$ <?= number_format($row['price'], 2) ?></td>
                            <td>N$ <?= number_format($row['cogs'], 2) ?></td>
                            <td>N$ <?= number_format($row['profit'], 2) ?></td>
                            <td><span class="status"><?= htmlspecialchars($row['margin'], ENT_QUOTES, 'UTF-8') ?></span></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </article>
        <article class="panel">
            <p class="eyebrow">Trends</p>
            <h2>Transport costs</h2>
            <p>Starter panel for monthly transport allocation trends and supplier spend breakdown. Connect it to invoice transport rows once extraction is live.</p>
        </article>
    </section>
</main>
<?php include BASE_PATH . '/shared/footer.php'; ?>

