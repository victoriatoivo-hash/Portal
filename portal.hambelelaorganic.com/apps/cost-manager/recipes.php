<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config.php';
require_once BASE_PATH . '/shared/auth.php';
require_once BASE_PATH . '/shared/database.php';

require_login();

$pageTitle = 'Recipes | ' . APP_NAME;
$activeApp = 'cost-manager';
$error = null;
$recipes = [];

try {
    $pdo = db();
    $recipes = $pdo->query(
        'SELECT fp.id AS product_id, fp.name, fp.sku, fp.selling_price, pr.id AS recipe_id,
                pr.transport_weight, pr.version,
                COUNT(ri.id) AS item_count
         FROM finished_products fp
         JOIN product_recipes pr ON pr.product_id = fp.id AND pr.is_active = 1
         LEFT JOIN recipe_items ri ON ri.recipe_id = pr.id
         GROUP BY fp.id, fp.name, fp.sku, fp.selling_price, pr.id, pr.transport_weight, pr.version
         ORDER BY fp.name'
    )->fetchAll();
} catch (Throwable $e) {
    $error = $e->getMessage();
}

include BASE_PATH . '/shared/header.php';
include BASE_PATH . '/shared/sidebar.php';
?>
<main class="workspace module">
    <section class="module-header">
        <div>
            <p class="eyebrow">Formulations</p>
            <h1>Recipes</h1>
            <p>Define what each finished product uses so the costing engine can calculate COGS from saved materials, packaging, and transport weight.</p>
        </div>
        <a class="button primary" href="create-recipe.php"><i data-lucide="plus"></i> New recipe</a>
    </section>

    <?php if ($error): ?>
        <section class="panel"><p><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p></section>
    <?php else: ?>
        <section class="panel">
            <table class="data-table">
                <thead><tr><th>Product</th><th>SKU</th><th>Selling price</th><th>Transport weight</th><th>Items</th><th></th></tr></thead>
                <tbody>
                    <?php foreach ($recipes as $recipe): ?>
                        <tr>
                            <td><?= htmlspecialchars($recipe['name'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars((string) $recipe['sku'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td>N$ <?= number_format((float) $recipe['selling_price'], 2) ?></td>
                            <td><?= number_format((float) $recipe['transport_weight'], 3) ?> kg</td>
                            <td><?= (int) $recipe['item_count'] ?></td>
                            <td><a class="button" href="recipe-cost.php?id=<?= (int) $recipe['recipe_id'] ?>">Cost</a></td>
                        </tr>
                    <?php endforeach; ?>
                    <?php if (!$recipes): ?><tr><td colspan="6">No recipes created yet.</td></tr><?php endif; ?>
                </tbody>
            </table>
        </section>
    <?php endif; ?>
</main>
<?php include BASE_PATH . '/shared/footer.php'; ?>

