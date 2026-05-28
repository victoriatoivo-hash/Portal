<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config.php';
require_once BASE_PATH . '/shared/auth.php';
require_once BASE_PATH . '/shared/database.php';
require_once BASE_PATH . '/shared/woocommerce.php';

require_login();

$pageTitle = 'Import WooCommerce Sales | ' . APP_NAME;
$activeApp = 'cost-manager';
$error = null;
$imported = 0;
$orders = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $pdo = db();
        $orders = wc_get('orders', [
            'status' => 'processing,completed',
            'per_page' => 50,
            'orderby' => 'date',
            'order' => 'desc',
        ]);

        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            'INSERT INTO woo_sales (woo_order_id, woo_product_id, quantity, unit_price, sold_at)
             VALUES (?, ?, ?, ?, ?)'
        );

        foreach ($orders as $order) {
            $soldAt = $order['date_created'] ?? date('Y-m-d H:i:s');
            foreach (($order['line_items'] ?? []) as $line) {
                $quantity = (float) ($line['quantity'] ?? 0);
                if ($quantity <= 0) {
                    continue;
                }
                $total = (float) ($line['total'] ?? 0);
                $unitPrice = $quantity > 0 ? $total / $quantity : 0;
                $stmt->execute([
                    (int) $order['id'],
                    (int) ($line['product_id'] ?? 0),
                    $quantity,
                    $unitPrice,
                    date('Y-m-d H:i:s', strtotime($soldAt)),
                ]);
                $imported++;
            }
        }

        $pdo->commit();
    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $error = $e->getMessage();
    }
}

include BASE_PATH . '/shared/header.php';
include BASE_PATH . '/shared/sidebar.php';
?>
<main class="workspace module">
    <section class="module-header">
        <div>
            <p class="eyebrow">WooCommerce</p>
            <h1>Import sales</h1>
            <p>Import recent completed and processing WooCommerce order lines into the costing database.</p>
        </div>
        <a class="button" href="profit-report.php"><i data-lucide="chart-no-axes-combined"></i> Profit report</a>
    </section>

    <section class="panel">
        <?php if (!wc_configured()): ?>
            <p>WooCommerce is not configured yet. Add `wc_store_url`, `wc_consumer_key`, and `wc_consumer_secret` to `config.local.php`.</p>
        <?php elseif ($error): ?>
            <p><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
        <?php elseif ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
            <p>Imported <?= (int) $imported ?> sales lines from <?= count($orders) ?> orders.</p>
        <?php else: ?>
            <p>Ready to import the latest 50 completed/processing WooCommerce orders.</p>
        <?php endif; ?>
        <form method="post" class="save-bar">
            <button class="button primary" type="submit">Import latest sales</button>
        </form>
    </section>
</main>
<?php include BASE_PATH . '/shared/footer.php'; ?>

