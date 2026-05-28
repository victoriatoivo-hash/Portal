<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config.php';
require_once BASE_PATH . '/shared/auth.php';
require_once BASE_PATH . '/shared/pdf-extractor.php';
require_once BASE_PATH . '/shared/openai-extractor.php';

require_login();

$pageTitle = 'Supplier Invoice Extraction Preview | ' . APP_NAME;
$activeApp = 'cost-manager';
$upload = uploaded_pdf_info('invoice_pdf', 'supplier-invoices');
$textResult = ['available' => false, 'text' => '', 'message' => $upload['error'] ?? 'No file processed.'];
$aiResult = ['ok' => false, 'message' => 'No AI extraction was run.', 'data' => [], 'raw' => ''];
$extracted = [];

if ($upload['ok'] ?? false) {
    $aiResult = openai_extract_pdf($upload['path'], $upload['name'], 'supplier', $_POST['supplier_name'] ?? '');
    if ($aiResult['ok']) {
        $extracted = $aiResult['data'];
        $textResult = ['available' => true, 'text' => $aiResult['raw'], 'message' => $aiResult['message']];
    } else {
        $textResult = extract_pdf_text($upload['path']);
        $extracted = parse_supplier_invoice_text($textResult['text']);
        $textResult['message'] = $aiResult['message'] . ' Fallback: ' . $textResult['message'];
    }
}

include BASE_PATH . '/shared/header.php';
include BASE_PATH . '/shared/sidebar.php';
?>
<main class="workspace module">
    <section class="module-header">
        <div>
            <p class="eyebrow">Extraction Preview</p>
            <h1>Supplier invoice results</h1>
            <p>Confirm the extracted invoice details before storing raw materials and packaging items.</p>
        </div>
        <a class="button" href="upload-invoice.php"><i data-lucide="arrow-left"></i> Upload another</a>
    </section>

    <section class="report-grid">
        <article class="panel">
            <table class="data-table">
                <tbody>
                    <tr><th>Supplier</th><td><?= htmlspecialchars($_POST['supplier_name'] ?? '', ENT_QUOTES, 'UTF-8') ?></td></tr>
                    <tr><th>PDF</th><td><?= htmlspecialchars($upload['name'] ?? 'No PDF uploaded', ENT_QUOTES, 'UTF-8') ?></td></tr>
                    <tr><th>Extractor status</th><td><?= htmlspecialchars($textResult['message'], ENT_QUOTES, 'UTF-8') ?></td></tr>
                    <tr><th>Invoice date</th><td><?= htmlspecialchars((string) (($_POST['invoice_date'] ?? '') ?: ($extracted['invoice_date'] ?? '')), ENT_QUOTES, 'UTF-8') ?></td></tr>
                    <tr><th>Invoice number</th><td><?= htmlspecialchars((string) ($extracted['invoice_number'] ?? ''), ENT_QUOTES, 'UTF-8') ?></td></tr>
                    <tr><th>Subtotal</th><td><?= isset($extracted['subtotal']) ? 'N$ ' . number_format((float) $extracted['subtotal'], 2) : '' ?></td></tr>
                    <tr><th>VAT</th><td><?= isset($extracted['vat_amount']) ? 'N$ ' . number_format((float) $extracted['vat_amount'], 2) : '' ?></td></tr>
                    <tr><th>Total</th><td><?= isset($extracted['total']) ? 'N$ ' . number_format((float) $extracted['total'], 2) : '' ?></td></tr>
                    <tr><th>Confidence</th><td><?= htmlspecialchars((string) ($extracted['confidence'] ?? ''), ENT_QUOTES, 'UTF-8') ?></td></tr>
                </tbody>
            </table>
        </article>
        <article class="panel">
            <p class="eyebrow">AI / Raw result</p>
            <p><?= $aiResult['ok'] ? 'OpenAI returned structured data. Review line items before saving.' : 'OpenAI was unavailable, so the local fallback was attempted.' ?></p>
            <pre class="text-preview"><?= htmlspecialchars(substr($textResult['text'], 0, 3000), ENT_QUOTES, 'UTF-8') ?></pre>
        </article>
    </section>

    <form class="save-form" action="save-invoice.php" method="post">
        <input type="hidden" name="supplier_name" value="<?= htmlspecialchars($_POST['supplier_name'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
        <input type="hidden" name="pdf_path" value="<?= htmlspecialchars($upload['path'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
        <section class="panel form-grid">
            <label>Invoice date<input name="invoice_date" value="<?= htmlspecialchars((string) (($_POST['invoice_date'] ?? '') ?: ($extracted['invoice_date'] ?? '')), ENT_QUOTES, 'UTF-8') ?>"></label>
            <label>Invoice number<input name="invoice_number" value="<?= htmlspecialchars((string) ($extracted['invoice_number'] ?? ''), ENT_QUOTES, 'UTF-8') ?>"></label>
        </section>

        <section class="panel">
            <div class="section-row">
                <div>
                    <p class="eyebrow">Review and Edit</p>
                    <h2>Raw materials</h2>
                </div>
                <span class="status"><?= count($extracted['raw_materials'] ?? []) ?> items</span>
            </div>
            <table class="data-table editable-table">
                <thead><tr><th>Product</th><th>Quantity</th><th>Unit</th><th>Unit price</th><th>Line total</th></tr></thead>
                <tbody>
                    <?php foreach (($extracted['raw_materials'] ?? []) as $item): ?>
                        <tr>
                            <td><input name="raw_name[]" value="<?= htmlspecialchars((string) ($item['name'] ?? ''), ENT_QUOTES, 'UTF-8') ?>"></td>
                            <td><input name="raw_quantity[]" type="number" step="0.001" value="<?= htmlspecialchars((string) ($item['quantity'] ?? ''), ENT_QUOTES, 'UTF-8') ?>"></td>
                            <td><input name="raw_unit[]" value="<?= htmlspecialchars((string) ($item['unit'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" placeholder="kg, ml, unit"></td>
                            <td><input name="raw_unit_price[]" type="number" step="0.0001" value="<?= htmlspecialchars((string) ($item['unit_price'] ?? ''), ENT_QUOTES, 'UTF-8') ?>"></td>
                            <td><input name="raw_line_total[]" type="number" step="0.01" value="<?= htmlspecialchars((string) ($item['line_total'] ?? ''), ENT_QUOTES, 'UTF-8') ?>"></td>
                        </tr>
                    <?php endforeach; ?>
                    <?php if (empty($extracted['raw_materials'])): ?>
                        <tr><td colspan="5">No raw material lines were extracted.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </section>

        <section class="panel">
            <div class="section-row">
                <div>
                    <p class="eyebrow">Review and Edit</p>
                    <h2>Packaging</h2>
                </div>
                <span class="status"><?= count($extracted['packaging'] ?? []) ?> items</span>
            </div>
            <table class="data-table editable-table">
                <thead><tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Unit price</th><th>Line total</th></tr></thead>
                <tbody>
                    <?php foreach (($extracted['packaging'] ?? []) as $item): ?>
                        <tr>
                            <td><input name="packaging_name[]" value="<?= htmlspecialchars((string) ($item['name'] ?? ''), ENT_QUOTES, 'UTF-8') ?>"></td>
                            <td><input name="packaging_quantity[]" type="number" step="0.001" value="<?= htmlspecialchars((string) ($item['quantity'] ?? ''), ENT_QUOTES, 'UTF-8') ?>"></td>
                            <td><input name="packaging_unit[]" value="<?= htmlspecialchars((string) ($item['unit'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" placeholder="unit"></td>
                            <td><input name="packaging_unit_price[]" type="number" step="0.0001" value="<?= htmlspecialchars((string) ($item['unit_price'] ?? ''), ENT_QUOTES, 'UTF-8') ?>"></td>
                            <td><input name="packaging_line_total[]" type="number" step="0.01" value="<?= htmlspecialchars((string) ($item['line_total'] ?? ''), ENT_QUOTES, 'UTF-8') ?>"></td>
                        </tr>
                    <?php endforeach; ?>
                    <?php if (empty($extracted['packaging'])): ?>
                        <tr><td colspan="5">No packaging lines were extracted.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </section>

        <div class="save-bar">
            <a class="button" href="upload-invoice.php">Cancel</a>
            <button class="button primary" type="submit">Confirm and save invoice</button>
        </div>
    </form>

    <section class="panel">
        <div class="section-row">
            <div>
                <p class="eyebrow">Review</p>
                <h2>Fields needing review</h2>
            </div>
        </div>
        <?php if (!empty($extracted['needs_review'])): ?>
            <div class="review-list">
                <?php foreach ($extracted['needs_review'] as $field): ?>
                    <span class="status"><?= htmlspecialchars((string) $field, ENT_QUOTES, 'UTF-8') ?></span>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <p>No review warnings returned.</p>
        <?php endif; ?>
    </section>
</main>
<?php include BASE_PATH . '/shared/footer.php'; ?>
