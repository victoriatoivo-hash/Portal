<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config.php';
require_once BASE_PATH . '/shared/auth.php';
require_once BASE_PATH . '/shared/database.php';

require_login();

$pageTitle = 'Recipe Saved | ' . APP_NAME;
$activeApp = 'cost-manager';
$error = null;
$recipeId = null;

try {
    $pdo = db();
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('INSERT INTO finished_products (name, sku, selling_price) VALUES (?, ?, ?)');
    $stmt->execute([
        trim((string) ($_POST['product_name'] ?? '')),
        trim((string) ($_POST['sku'] ?? '')) ?: null,
        (float) ($_POST['selling_price'] ?? 0),
    ]);
    $productId = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare('INSERT INTO product_recipes (product_id, transport_weight) VALUES (?, ?)');
    $stmt->execute([$productId, (float) ($_POST['transport_weight'] ?? 0)]);
    $recipeId = (int) $pdo->lastInsertId();

    $refs = $_POST['component_ref'] ?? [];
    foreach ($refs as $index => $ref) {
        $ref = (string) $ref;
        $quantity = (float) ($_POST['component_quantity'][$index] ?? 0);
        if ($ref === '' || $quantity <= 0) {
            continue;
        }

        $parts = explode(':', $ref, 4);
        $type = ($parts[0] ?? '') === 'packaging' ? 'packaging' : 'raw_material';
        $componentId = (int) ($parts[1] ?? 0);
        $name = trim((string) ($parts[2] ?? ''));
        $unit = trim((string) ($_POST['component_unit'][$index] ?? ($parts[3] ?? 'unit'))) ?: 'unit';

        $stmt = $pdo->prepare('INSERT INTO recipe_items (recipe_id, component_type, component_id, component_name, quantity, unit) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$recipeId, $type, $componentId, $name, $quantity, $unit]);
    }

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
            <h1><?= $error ? 'Recipe could not be saved' : 'Recipe saved' ?></h1>
            <p><?= $error ? htmlspecialchars($error, ENT_QUOTES, 'UTF-8') : 'The product recipe is ready for cost calculation.' ?></p>
        </div>
        <div class="actions">
            <a class="button" href="create-recipe.php">Create another</a>
            <a class="button primary" href="<?= $recipeId ? 'recipe-cost.php?id=' . (int) $recipeId : 'recipes.php' ?>">View cost</a>
        </div>
    </section>
</main>
<?php include BASE_PATH . '/shared/footer.php'; ?>
