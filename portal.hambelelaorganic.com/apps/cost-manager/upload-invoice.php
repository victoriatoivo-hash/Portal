<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config.php';
require_once BASE_PATH . '/shared/auth.php';

require_login();

$pageTitle = 'Upload Invoice | ' . APP_NAME;
$activeApp = 'cost-manager';

include BASE_PATH . '/shared/header.php';
include BASE_PATH . '/shared/sidebar.php';
?>
<main class="workspace module">
    <section class="module-header">
        <div>
            <p class="eyebrow">Invoice Processing</p>
            <h1>Upload supplier invoice</h1>
            <p>Use this page for supplier invoices that contain raw materials or packaging. Courier and freight invoices now have their own upload page so consignment weight can be extracted from the transport PDF.</p>
        </div>
        <a class="button primary" href="upload-transport.php"><i data-lucide="truck"></i> Upload transport invoice</a>
    </section>

    <div class="invoice-tabs" aria-label="Invoice upload type">
        <a class="active" href="upload-invoice.php"><i data-lucide="file-text"></i> Supplier invoice</a>
        <a href="upload-transport.php"><i data-lucide="truck"></i> Transport invoice</a>
    </div>

    <form class="panel form-grid" action="invoice-preview.php" method="post" enctype="multipart/form-data">
        <label>Supplier name<input name="supplier_name" placeholder="Supplier"></label>
        <label>Invoice date<input name="invoice_date" type="date"></label>
        <label class="span-2">Invoice PDF<input name="invoice_pdf" type="file" accept="application/pdf"></label>
        <div class="span-2 extraction-hint">
            <strong>For transport, use the transport invoice tab.</strong>
            <span>That page extracts consignment weight, route, waybill number, transport cost, VAT, and invoice date from the courier PDF.</span>
        </div>
        <label class="span-2">Notes<textarea name="notes" placeholder="Anything unusual on this invoice"></textarea></label>
        <div class="span-2"><button class="button primary" type="submit">Preview extraction</button></div>
    </form>
</main>
<?php include BASE_PATH . '/shared/footer.php'; ?>
