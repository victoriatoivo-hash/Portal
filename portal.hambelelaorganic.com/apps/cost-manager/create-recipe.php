<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config.php';
require_once BASE_PATH . '/shared/auth.php';
require_once BASE_PATH . '/shared/database.php';

require_login();

$pageTitle = 'Create Recipe | ' . APP_NAME;
$activeApp = 'cost-manager';
$error = null;
$rawMaterials = [];
$packagingItems = [];

try {
    $pdo = db();
    $rawMaterials = $pdo->query(
        'SELECT MAX(id) AS id, name, unit, MAX(unit_cost) AS unit_cost
         FROM raw_materials
         GROUP BY name, unit
         ORDER BY name'
    )->fetchAll();
    $packagingItems = $pdo->query(
        'SELECT MAX(id) AS id, name, unit, MAX(unit_cost) AS unit_cost
         FROM packaging
         GROUP BY name, unit
         ORDER BY name'
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
            <h1>Create recipe</h1>
            <p>Add the finished product, selling price, transport weight, and the raw material or packaging components used per unit.</p>
        </div>
        <a class="button" href="recipes.php"><i data-lucide="list"></i> View recipes</a>
    </section>

    <?php if ($error): ?>
        <section class="panel"><p><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p></section>
    <?php else: ?>
        <form class="save-form" action="save-recipe.php" method="post">
            <section class="panel form-grid">
                <label>Finished product name<input name="product_name" placeholder="Castor Oil 500ml" required></label>
                <label>SKU<input name="sku" placeholder="Optional SKU"></label>
                <label>Selling price<input name="selling_price" type="number" step="0.01" placeholder="0.00"></label>
                <label>Transport weight kg<input name="transport_weight" type="number" step="0.001" placeholder="0.500"></label>
            </section>

            <section class="panel">
                <div class="section-row">
                    <div><p class="eyebrow">Components</p><h2>Recipe items</h2></div>
                    <span class="status">Add up to 8 lines</span>
                </div>
                <table class="data-table editable-table">
                    <thead><tr><th>Type</th><th>Component</th><th>Quantity per unit</th><th>Unit</th></tr></thead>
                    <tbody>
                        <?php for ($i = 0; $i < 8; $i++): ?>
                            <tr>
                                <td>
                                    <select name="component_type[]">
                                        <option value="raw_material">Raw material</option>
                                        <option value="packaging">Packaging</option>
                                    </select>
                                </td>
                                <td>
                                    <select name="component_ref[]">
                                        <option value="">Select component</option>
                                        <optgroup label="Raw materials">
                                            <?php foreach ($rawMaterials as $item): ?>
                                                <option value="raw_material:<?= (int) $item['id'] ?>:<?= htmlspecialchars($item['name'], ENT_QUOTES, 'UTF-8') ?>:<?= htmlspecialchars($item['unit'], ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars($item['name'], ENT_QUOTES, 'UTF-8') ?> - <?= htmlspecialchars($item['unit'], ENT_QUOTES, 'UTF-8') ?></option>
                                            <?php endforeach; ?>
                                        </optgroup>
                                        <optgroup label="Packaging">
                                            <?php foreach ($packagingItems as $item): ?>
                                                <option value="packaging:<?= (int) $item['id'] ?>:<?= htmlspecialchars($item['name'], ENT_QUOTES, 'UTF-8') ?>:<?= htmlspecialchars($item['unit'], ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars($item['name'], ENT_QUOTES, 'UTF-8') ?> - <?= htmlspecialchars($item['unit'], ENT_QUOTES, 'UTF-8') ?></option>
                                            <?php endforeach; ?>
                                        </optgroup>
                                    </select>
                                </td>
                                <td><input name="component_quantity[]" type="number" step="0.001" placeholder="0"></td>
                                <td><input name="component_unit[]" placeholder="kg, ml, unit"></td>
                            </tr>
                        <?php endfor; ?>
                    </tbody>
                </table>
            </section>

            <div class="save-bar">
                <a class="button" href="recipes.php">Cancel</a>
                <button class="button primary" type="submit">Save recipe</button>
            </div>
        </form>
    <?php endif; ?>
</main>
<?php include BASE_PATH . '/shared/footer.php'; ?>
