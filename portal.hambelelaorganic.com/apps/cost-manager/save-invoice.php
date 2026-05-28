<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config.php';
require_once BASE_PATH . '/shared/auth.php';
require_once BASE_PATH . '/shared/save-invoice.php';

require_login();

$pageTitle = 'Invoice Saved | ' . APP_NAME;
$activeApp = 'cost-manager';
$error = null;
$summary = [];

try {
    $pdo = db();
    $pdo->beginTransaction();

    $supplierId = ensure_supplier($pdo, post_string('supplier_name'));

    $stmt = $pdo->prepare('INSERT INTO supplier_invoices (supplier_id, invoice_number, invoice_date, pdf_path) VALUES (?, ?, ?, ?)');
    $stmt->execute([
        $supplierId,
        post_string('invoice_number') ?: null,
        nullable_date(post_string('invoice_date')),
        post_string('pdf_path') ?: null,
    ]);
    $invoiceId = (int) $pdo->lastInsertId();

    $rawNames = $_POST['raw_name'] ?? [];
    foreach ($rawNames as $index => $name) {
        $name = trim((string) $name);
        if ($name === '') {
            continue;
        }

        $quantity = (float) ($_POST['raw_quantity'][$index] ?? 0);
        $unit = trim((string) ($_POST['raw_unit'][$index] ?? 'unit')) ?: 'unit';
        $unitCost = (float) ($_POST['raw_unit_price'][$index] ?? 0);
        $totalCost = (float) ($_POST['raw_line_total'][$index] ?? 0);

        $stmt = $pdo->prepare('INSERT INTO raw_materials (invoice_id, supplier_id, name, quantity, unit, unit_cost, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$invoiceId, $supplierId, $name, $quantity, $unit, $unitCost, $totalCost]);
        $summary['raw_materials'] = ($summary['raw_materials'] ?? 0) + 1;
    }

    $packagingNames = $_POST['packaging_name'] ?? [];
    foreach ($packagingNames as $index => $name) {
        $name = trim((string) $name);
        if ($name === '') {
            continue;
        }

        $quantity = (float) ($_POST['packaging_quantity'][$index] ?? 0);
        $unit = trim((string) ($_POST['packaging_unit'][$index] ?? 'unit')) ?: 'unit';
        $unitCost = (float) ($_POST['packaging_unit_price'][$index] ?? 0);
        $totalCost = (float) ($_POST['packaging_line_total'][$index] ?? 0);

        $stmt = $pdo->prepare('INSERT INTO packaging (invoice_id, supplier_id, name, quantity, unit, unit_cost, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$invoiceId, $supplierId, $name, $quantity, $unit, $unitCost, $totalCost]);
        $summary['packaging'] = ($summary['packaging'] ?? 0) + 1;
    }

    $pdo->commit();
    $summary['invoice_id'] = $invoiceId;
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $error = $e->getMessage();
}

include BASE_PATH . '/shared/header.php';
include BASE_PATH . '/shared/sidebar.php';
?>
<main class="workspace module">
    <section class="module-header">
        <div>
            <p class="eyebrow"><?= $error ? 'Save Failed' : 'Saved' ?></p>
            <h1><?= $error ? 'Invoice could not be saved' : 'Supplier invoice saved' ?></h1>
            <p><?= $error ? htmlspecialchars($error, ENT_QUOTES, 'UTF-8') : 'The invoice and extracted items were saved to the costing database.' ?></p>
        </div>
        <div class="actions">
            <a class="button" href="upload-invoice.php">Upload another</a>
            <a class="button" href="saved-invoices.php">View saved data</a>
            <a class="button primary" href="products.php">View recipes</a>
        </div>
    </section>

    <?php if (!$error): ?>
        <section class="metric-grid">
            <article class="metric"><span>Invoice ID</span><strong><?= (int) $summary['invoice_id'] ?></strong></article>
            <article class="metric"><span>Raw materials</span><strong><?= (int) ($summary['raw_materials'] ?? 0) ?></strong></article>
            <article class="metric"><span>Packaging</span><strong><?= (int) ($summary['packaging'] ?? 0) ?></strong></article>
            <article class="metric"><span>Status</span><strong>Saved</strong></article>
        </section>
    <?php endif; ?>
</main>
<?php include BASE_PATH . '/shared/footer.php'; ?>
