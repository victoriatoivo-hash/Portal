<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config.php';
require_once BASE_PATH . '/shared/auth.php';
require_once BASE_PATH . '/shared/database.php';

require_login();

$pageTitle = 'Transport Allocation Saved | ' . APP_NAME;
$activeApp = 'cost-manager';
$error = null;
$count = 0;

try {
    $pdo = db();
    $pdo->beginTransaction();

    $transportId = (int) ($_POST['transport_invoice_id'] ?? 0);
    $transportLineId = (int) ($_POST['transport_invoice_line_id'] ?? 0);
    $basis = $_POST['allocation_basis'] ?? 'order_weight';
    $includes = $_POST['include'] ?? [];
    $allocationValues = $_POST['allocation_value'] ?? [];
    $allocatedCosts = $_POST['allocated_cost'] ?? [];

    foreach ($includes as $key) {
        [$type, $id] = explode(':', (string) $key, 2);
        $type = $type === 'packaging' ? 'packaging' : 'raw_material';
        $componentId = (int) $id;
        $allocationValue = (float) ($allocationValues[$key] ?? 0);
        $allocatedCost = (float) ($allocatedCosts[$key] ?? 0);

        $stmt = $pdo->prepare('INSERT INTO transport_allocations (transport_invoice_id, transport_invoice_line_id, component_type, component_id, allocation_basis, allocation_value, allocated_cost) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$transportId, $transportLineId ?: null, $type, $componentId, $basis, $allocationValue, $allocatedCost]);
        $count++;
    }

    $stmt = $pdo->prepare('UPDATE transport_invoices SET status = ? WHERE id = ?');
    $stmt->execute([$count > 0 ? 'allocated' : 'pending', $transportId]);

    $pdo->commit();
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
            <h1><?= $error ? 'Transport allocation failed' : 'Transport allocation saved' ?></h1>
            <p><?= $error ? htmlspecialchars($error, ENT_QUOTES, 'UTF-8') : $count . ' allocation rows were saved.' ?></p>
        </div>
        <div class="actions">
            <a class="button" href="allocate-transport.php">Allocate another</a>
            <a class="button primary" href="saved-invoices.php">View saved data</a>
        </div>
    </section>
</main>
<?php include BASE_PATH . '/shared/footer.php'; ?>
