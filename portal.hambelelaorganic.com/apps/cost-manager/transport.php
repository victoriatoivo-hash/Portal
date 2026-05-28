<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config.php';
require_once BASE_PATH . '/shared/auth.php';

require_login();

$pageTitle = 'Transport Costs | ' . APP_NAME;
$activeApp = 'cost-manager';

$transportRows = [
    ['supplier' => 'Chempack', 'provider' => 'Courier delivery', 'reference' => 'Supplier INV-1042', 'weight' => '38.5 kg', 'basis' => 'Weight', 'cost' => 480.00, 'status' => 'Allocated'],
    ['supplier' => 'Packaging supplier', 'provider' => 'Freight clearing', 'reference' => 'PO-2218', 'weight' => '120.0 kg', 'basis' => 'Weight', 'cost' => 1260.00, 'status' => 'Pending'],
    ['supplier' => 'Retail orders', 'provider' => 'Local delivery', 'reference' => 'May retail orders', 'weight' => 'N/A', 'basis' => 'Item quantity', 'cost' => 310.00, 'status' => 'Allocated'],
];
$transportLines = [];

try {
    $pdo = db();
    $transportLines = $pdo->query(
        'SELECT til.supplier_name, til.waybill_number, til.description, til.route, til.chargeable_weight_kg, til.line_amount
         FROM transport_invoice_lines til
         ORDER BY til.id DESC
         LIMIT 30'
    )->fetchAll();
} catch (Throwable $e) {
    $transportLines = [];
}

include BASE_PATH . '/shared/header.php';
include BASE_PATH . '/shared/sidebar.php';
?>
<main class="workspace module">
    <section class="module-header">
        <div>
            <p class="eyebrow">Transport Costs</p>
            <h1>Transport invoices</h1>
            <p>Track courier and freight invoices separately. Extracted consignment weight can be used to allocate transport costs into product COGS.</p>
        </div>
        <a class="button primary" href="upload-transport.php"><i data-lucide="upload"></i> Upload transport invoice</a>
    </section>

    <section class="metric-grid" aria-label="Transport metrics">
        <article class="metric"><span>This month</span><strong>N$ 2,050</strong></article>
        <article class="metric"><span>Allocated</span><strong>N$ 790</strong></article>
        <article class="metric"><span>Pending</span><strong>N$ 1,260</strong></article>
        <article class="metric"><span>Average per order</span><strong>N$ 18.40</strong></article>
    </section>

    <section class="report-grid">
        <article class="panel">
            <table class="data-table">
                <thead><tr><th>Supplier</th><th>Provider</th><th>Linked to</th><th>Weight</th><th>Basis</th><th>Cost</th><th>Status</th></tr></thead>
                <tbody>
                    <?php foreach ($transportRows as $row): ?>
                        <tr>
                            <td><?= htmlspecialchars($row['supplier'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars($row['provider'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars($row['reference'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars($row['weight'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars($row['basis'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td>N$ <?= number_format($row['cost'], 2) ?></td>
                            <td><span class="status"><?= htmlspecialchars($row['status'], ENT_QUOTES, 'UTF-8') ?></span></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </article>
        <article class="panel">
            <p class="eyebrow">Allocation rules</p>
            <h2>Recommended setup</h2>
            <p>Use order weight for raw materials, invoice value for mixed supplier shipments, item quantity for small local deliveries, and manual split for unusual shipments.</p>
        </article>
    </section>

    <section class="panel">
        <div class="section-row">
            <div><p class="eyebrow">Waybill Lines</p><h2>Consignment lines</h2></div>
            <a class="button" href="allocate-transport.php">Allocate</a>
        </div>
        <table class="data-table">
            <thead><tr><th>Supplier</th><th>Waybill</th><th>Description</th><th>Route</th><th>Weight</th><th>Amount</th></tr></thead>
            <tbody>
                <?php foreach ($transportLines as $line): ?>
                    <tr>
                        <td><?= htmlspecialchars((string) $line['supplier_name'], ENT_QUOTES, 'UTF-8') ?></td>
                        <td><?= htmlspecialchars((string) $line['waybill_number'], ENT_QUOTES, 'UTF-8') ?></td>
                        <td><?= htmlspecialchars((string) $line['description'], ENT_QUOTES, 'UTF-8') ?></td>
                        <td><?= htmlspecialchars((string) $line['route'], ENT_QUOTES, 'UTF-8') ?></td>
                        <td><?= number_format((float) $line['chargeable_weight_kg'], 3) ?> kg</td>
                        <td>N$ <?= number_format((float) $line['line_amount'], 2) ?></td>
                    </tr>
                <?php endforeach; ?>
                <?php if (!$transportLines): ?><tr><td colspan="6">No waybill lines saved yet.</td></tr><?php endif; ?>
            </tbody>
        </table>
    </section>
</main>
<?php include BASE_PATH . '/shared/footer.php'; ?>
