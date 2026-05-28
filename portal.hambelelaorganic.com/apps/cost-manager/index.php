<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config.php';
require_once BASE_PATH . '/shared/auth.php';

require_login();

$pageTitle = 'Cost Manager | ' . APP_NAME;
$activeApp = 'cost-manager';

include BASE_PATH . '/shared/header.php';
include BASE_PATH . '/shared/sidebar.php';
?>
<main class="workspace module">
    <section class="module-header">
        <div>
            <p class="eyebrow">Module 1-3</p>
            <h1>Cost Manager</h1>
            <p>Process supplier invoices, maintain product recipes, allocate transport, and turn WooCommerce sales into clear product-level profit.</p>
        </div>
        <div class="actions">
            <a class="button primary" href="upload-invoice.php"><i data-lucide="upload"></i> Upload invoice</a>
            <a class="button" href="upload-transport.php"><i data-lucide="truck"></i> Transport invoice</a>
            <a class="button" href="allocate-transport.php"><i data-lucide="git-branch"></i> Allocate transport</a>
            <a class="button" href="saved-invoices.php"><i data-lucide="database"></i> Saved data</a>
            <a class="button" href="recipes.php"><i data-lucide="flask-conical"></i> Recipes</a>
            <a class="button" href="import-sales.php"><i data-lucide="download"></i> Import sales</a>
            <a class="button" href="profit-report.php"><i data-lucide="chart-no-axes-combined"></i> Profit report</a>
        </div>
    </section>

    <section class="metric-grid" aria-label="Cost manager metrics">
        <article class="metric"><span>Sales imported</span><strong>N$ 38,420</strong></article>
        <article class="metric"><span>Total COGS</span><strong>N$ 21,884</strong></article>
        <article class="metric"><span>Gross profit</span><strong>N$ 16,536</strong></article>
        <article class="metric"><span>Average margin</span><strong>43.0%</strong></article>
    </section>

    <section class="workflow-grid" aria-label="Costing workflow">
        <article class="workflow-card">
            <i data-lucide="file-scan"></i>
            <h2>Invoice Processing</h2>
            <p>Upload supplier PDFs and capture raw materials, packaging, quantities, prices, and transport costs into structured tables.</p>
        </article>
        <article class="workflow-card">
            <i data-lucide="truck"></i>
            <h2>Transport Invoices</h2>
            <p>Upload courier and freight invoices separately, then link them to supplier invoices, purchase orders, date ranges, or batches.</p>
        </article>
        <article class="workflow-card">
            <i data-lucide="clipboard-list"></i>
            <h2>Recipes</h2>
            <p>Define finished products like Castor Oil 500ml using ingredients, packaging components, labels, caps, and allocation weight.</p>
        </article>
        <article class="workflow-card">
            <i data-lucide="calculator"></i>
            <h2>COGS Engine</h2>
            <p>Match WooCommerce sales to recipes and calculate raw material cost, packaging, allocated transport, and gross profit per unit.</p>
        </article>
    </section>
</main>
<?php include BASE_PATH . '/shared/footer.php'; ?>
