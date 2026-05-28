# Hambelela Business Portal

PHP starter portal for `portal.hambelelaorganic.com`.

## Structure

- `index.php` is the business app launcher.
- `login.php` is the single sign-on placeholder.
- `shared/` contains common auth, database, header, sidebar, and footer files.
- `apps/cost-manager/` contains the first active module:
  - invoice upload and extraction preview
  - separate transport invoice upload, weight extraction, and allocation preview
  - product recipe listing
  - profitability report
  - JSON API starter
- `schema.sql` contains starter MySQL tables for suppliers, invoices, raw materials, packaging, transport invoices, transport allocations, recipes, and WooCommerce sales.
- `preview.html` is a static visual preview for machines without PHP.

## Database

Set database credentials with environment variables where possible:

```bash
HAMBELELA_DB_HOST=localhost
HAMBELELA_DB_NAME=hambelela_portal
HAMBELELA_DB_USER=root
HAMBELELA_DB_PASS=
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
WC_STORE_URL=https://www.hambelelaorganic.com
WC_CONSUMER_KEY=ck_...
WC_CONSUMER_SECRET=cs_...
```

Then import `schema.sql` into MySQL.
If you already imported an older version of the schema, run `migrations.sql` once.

If your hosting does not support environment variables, copy `config.local.example.php` to `config.local.php` and paste your new OpenAI API key there.
Also add your cPanel MySQL database name, username, and password to `config.local.php`.
Add fresh read-only WooCommerce REST API credentials to `config.local.php` before importing sales.
Do not use an API key that has been posted in chat or shared anywhere public; revoke it and create a fresh key first.

## PDF Extraction

The preview pages save uploaded PDFs and use OpenAI first when `OPENAI_API_KEY` is configured.
OpenAI receives the PDF as a file input and returns structured JSON for review.
If OpenAI is not configured or fails, the system falls back to Poppler `pdftotext` when it is installed on the server.

## Local PHP Run

From this folder:

```bash
php -S localhost:8080
```

Open `http://localhost:8080/index.php`.
