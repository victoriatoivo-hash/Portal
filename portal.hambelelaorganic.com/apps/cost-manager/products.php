<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config.php';
require_once BASE_PATH . '/shared/auth.php';

require_login();

$pageTitle = 'Product Recipes | ' . APP_NAME;
$activeApp = 'cost-manager';

$recipes = [
    ['product' => 'Castor Oil 500ml', 'raw' => '500ml castor oil', 'packaging' => 'Amber bottle 500ml, cap 28mm, label', 'basis' => '500g order weight'],
    ['product' => 'Shea Butter 250g', 'raw' => '250g unrefined shea butter', 'packaging' => '250ml jar, lid, label', 'basis' => '250g order weight'],
    ['product' => 'Hibiscus 100g', 'raw' => '100g dried hibiscus', 'packaging' => 'Stand-up pouch, label', 'basis' => '100g order weight'],
];

include BASE_PATH . '/shared/header.php';
include BASE_PATH . '/shared/sidebar.php';
?>
<main class="workspace module">
    <section class="module-header">
        <div>
            <p class="eyebrow">Formulations</p>
            <h1>Product recipes</h1>
            <p>Every finished product needs a formulation so the COGS engine can look up raw materials, packaging, and transport allocation.</p>
        </div>
        <a class="button primary" href="../formulator/create-recipe.php"><i data-lucide="plus"></i> New recipe</a>
    </section>

    <section class="panel">
        <table class="data-table">
            <thead><tr><th>Product</th><th>Raw material</th><th>Packaging</th><th>Transport basis</th><th>Status</th></tr></thead>
            <tbody>
                <?php foreach ($recipes as $recipe): ?>
                    <tr>
                        <td><?= htmlspecialchars($recipe['product'], ENT_QUOTES, 'UTF-8') ?></td>
                        <td><?= htmlspecialchars($recipe['raw'], ENT_QUOTES, 'UTF-8') ?></td>
                        <td><?= htmlspecialchars($recipe['packaging'], ENT_QUOTES, 'UTF-8') ?></td>
                        <td><?= htmlspecialchars($recipe['basis'], ENT_QUOTES, 'UTF-8') ?></td>
                        <td><span class="status">Ready</span></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </section>
</main>
<?php include BASE_PATH . '/shared/footer.php'; ?>

