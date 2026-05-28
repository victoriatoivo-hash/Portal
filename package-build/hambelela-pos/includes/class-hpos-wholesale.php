<?php
if (!defined('ABSPATH')) exit;

class HPOS_Wholesale {

    public static function init() {
        add_action('init',             [__CLASS__, 'register_role']);
        add_action('init',             [__CLASS__, 'create_pages']);
        add_shortcode('ws_register',   [__CLASS__, 'sc_register']);
        add_shortcode('ws_login',      [__CLASS__, 'sc_login']);
        add_shortcode('ws_dashboard',  [__CLASS__, 'sc_dashboard']);
        add_shortcode('ws_catalogue',  [__CLASS__, 'sc_catalogue']);
        add_shortcode('ws_orders',     [__CLASS__, 'sc_orders']);
        add_shortcode('ws_invoices',   [__CLASS__, 'sc_invoices']);
        add_action('wp_enqueue_scripts',[__CLASS__, 'enqueue']);
        // Invoice PDF generation
        add_action('template_redirect', [__CLASS__, 'maybe_generate_invoice']);
    }

    public static function register_role() {
        if(!get_role('wholesale_customer')) {
            add_role('wholesale_customer','Wholesale Customer',['read'=>true]);
        }
    }

    public static function create_pages() {
        // Only run once
        if(get_option('hpos_ws_pages_created')) return;
        $pages = [
            'wholesale'           => ['title'=>'Wholesale Portal',     'content'=>'[ws_dashboard]'],
            'wholesale-register'  => ['title'=>'Wholesale Register',   'content'=>'[ws_register]'],
            'wholesale-login'     => ['title'=>'Wholesale Login',      'content'=>'[ws_login]'],
            'wholesale-dashboard' => ['title'=>'Wholesale Dashboard',  'content'=>'[ws_dashboard]'],
            'wholesale-catalogue' => ['title'=>'Wholesale Catalogue',  'content'=>'[ws_catalogue]'],
            'wholesale-orders'    => ['title'=>'My Orders',            'content'=>'[ws_orders]'],
            'wholesale-invoices'  => ['title'=>'My Invoices',          'content'=>'[ws_invoices]'],
        ];
        foreach($pages as $slug => $data) {
            if(!get_page_by_path($slug)) {
                wp_insert_post(['post_title'=>$data['title'],'post_content'=>$data['content'],
                                'post_status'=>'publish','post_type'=>'page','post_name'=>$slug]);
            }
        }
        update_option('hpos_ws_pages_created','1');
    }

    public static function enqueue() {
        if(!is_page(['wholesale','wholesale-register','wholesale-login','wholesale-dashboard',
                     'wholesale-catalogue','wholesale-orders','wholesale-invoices'])) return;
        wp_enqueue_style('hpos-ws-style', HPOS_URL.'assets/css/wholesale.css', [], HPOS_VERSION);
        wp_enqueue_script('hpos-ws-script', HPOS_URL.'assets/js/wholesale-portal.js', [], HPOS_VERSION, true);
        wp_localize_script('hpos-ws-script','hposWS',[
            'apiUrl'   => rest_url('hpos/v1'),
            'nonce'    => wp_create_nonce('wp_rest'),
            'userId'   => get_current_user_id(),
            'isWS'     => self::is_ws_user(),
            'currency' => get_option('hpos_currency','N$'),
            'storeName'=> get_option('hpos_store_name','Hambelela Organic'),
            'storePhone'=> get_option('hpos_store_phone','+264 856628598'),
            'storeWebsite'=> get_option('hpos_cat_website','www.hambelelaorganic.com'),
            'loginUrl' => home_url('/wholesale-login'),
            'dashUrl'  => home_url('/wholesale-dashboard'),
            'regUrl'   => home_url('/wholesale-register'),
        ]);
    }

    public static function is_ws_user() {
        if(!is_user_logged_in()) return false;
        $u = wp_get_current_user();
        return in_array('wholesale_customer',$u->roles)||in_array('administrator',$u->roles)||in_array('shop_manager',$u->roles);
    }

    // ── SHORTCODES ─────────────────────────────────────────────────

    public static function sc_register() {
        if(self::is_ws_user()) {
            return '<div class="ws-notice ws-notice-info">You already have a wholesale account. <a href="'.home_url('/wholesale-dashboard').'">Go to Dashboard →</a></div>';
        }
        ob_start(); ?>
        <div class="ws-page" id="ws-register-page">
          <div class="ws-card ws-card-narrow">
            <div class="ws-card-head">
              <div class="ws-logo">🌿</div>
              <h2>Apply for Wholesale Access</h2>
              <p>For pharmacies, beauty stores, spas and distributors</p>
            </div>
            <div id="ws-reg-msg"></div>
            <form id="ws-reg-form" onsubmit="wsSubmitReg(event)">
              <div class="ws-field-row">
                <div class="ws-field"><label>Business Name *</label><input type="text" name="business_name" required placeholder="e.g. City Pharmacy Windhoek"></div>
                <div class="ws-field"><label>Contact Person *</label><input type="text" name="contact_person" required placeholder="Full name"></div>
              </div>
              <div class="ws-field-row">
                <div class="ws-field"><label>Email Address *</label><input type="email" name="email" required placeholder="orders@yourbusiness.com"></div>
                <div class="ws-field"><label>Phone / WhatsApp *</label><input type="tel" name="phone" required placeholder="+264 ..."></div>
              </div>
              <div class="ws-field-row">
                <div class="ws-field"><label>City *</label><input type="text" name="city" required placeholder="Windhoek"></div>
                <div class="ws-field"><label>Business Type *</label>
                  <select name="business_type" required>
                    <option value="">— Select —</option>
                    <option>Pharmacy</option>
                    <option>Beauty Store</option>
                    <option>Spa / Wellness Centre</option>
                    <option>Distributor</option>
                    <option>Other Retail</option>
                  </select>
                </div>
              </div>
              <button type="submit" class="ws-btn ws-btn-primary ws-btn-full" id="ws-reg-submit">Submit Application</button>
              <p class="ws-form-note">Your application will be reviewed within 1–2 business days. You will receive login credentials by email once approved.</p>
            </form>
          </div>
        </div>
        <?php return ob_get_clean();
    }

    public static function sc_login() {
        if(self::is_ws_user()) {
            wp_redirect(home_url('/wholesale-dashboard')); exit;
        }
        ob_start(); ?>
        <div class="ws-page" id="ws-login-page">
          <div class="ws-card ws-card-narrow">
            <div class="ws-card-head">
              <div class="ws-logo">🌿</div>
              <h2>Wholesale Login</h2>
              <p>Hambelela Organic B2B Portal</p>
            </div>
            <div id="ws-login-msg"></div>
            <form id="ws-login-form" onsubmit="wsSubmitLogin(event)">
              <div class="ws-field"><label>Email Address</label><input type="email" name="email" required placeholder="your@email.com"></div>
              <div class="ws-field"><label>Password</label><input type="password" name="password" required placeholder="••••••••"></div>
              <button type="submit" class="ws-btn ws-btn-primary ws-btn-full">Log In</button>
            </form>
            <div class="ws-divider"></div>
            <p class="ws-form-note" style="text-align:center">Don't have an account? <a href="<?php echo home_url('/wholesale-register'); ?>">Apply for wholesale access →</a></p>
          </div>
        </div>
        <?php return ob_get_clean();
    }

    public static function sc_dashboard() {
        if(!self::is_ws_user()) {
            return '<div class="ws-notice ws-notice-warn">Please <a href="'.home_url('/wholesale-login').'">log in</a> to access the wholesale portal.</div>';
        }
        $user = wp_get_current_user();
        $biz  = get_user_meta($user->ID,'_ws_business_name',true) ?: $user->display_name;
        ob_start(); ?>
        <div class="ws-page" id="ws-dashboard-page">
          <div class="ws-dash-header">
            <div class="ws-dash-welcome">
              <span class="ws-dash-logo">🌿</span>
              <div>
                <h2>Welcome back, <?php echo esc_html($biz); ?></h2>
                <p>Hambelela Organic Wholesale Portal</p>
              </div>
            </div>
            <a href="<?php echo wp_logout_url(home_url('/wholesale-login')); ?>" class="ws-btn ws-btn-ghost ws-btn-sm">Log Out</a>
          </div>

          <div class="ws-dash-nav">
            <a href="<?php echo home_url('/wholesale-catalogue'); ?>" class="ws-nav-card">
              <span class="ws-nav-icon">📦</span>
              <span class="ws-nav-label">Catalogue &amp; Order</span>
            </a>
            <a href="#ws-quick-reorder" class="ws-nav-card" onclick="wsDashSection('reorder')">
              <span class="ws-nav-icon">⚡</span>
              <span class="ws-nav-label">Quick Reorder</span>
            </a>
            <a href="<?php echo home_url('/wholesale-orders'); ?>" class="ws-nav-card">
              <span class="ws-nav-icon">📋</span>
              <span class="ws-nav-label">My Orders</span>
            </a>
            <a href="<?php echo home_url('/wholesale-invoices'); ?>" class="ws-nav-card">
              <span class="ws-nav-icon">🧾</span>
              <span class="ws-nav-label">Invoices</span>
            </a>
          </div>

          <!-- Quick reorder section -->
          <div id="ws-quick-reorder" class="ws-section" style="display:none">
            <h3 class="ws-section-title">⚡ Quick Reorder</h3>
            <div id="ws-reorder-content"><div class="ws-loading">Loading your previous orders…</div></div>
          </div>

          <!-- Saved lists section -->
          <div id="ws-saved-lists-section" class="ws-section">
            <div class="ws-section-hdr">
              <h3 class="ws-section-title">📌 Saved Order Lists</h3>
            </div>
            <div id="ws-saved-lists-content"><div class="ws-loading">Loading saved lists…</div></div>
          </div>
        </div>
        <?php return ob_get_clean();
    }

    public static function sc_catalogue() {
        if(!self::is_ws_user()) {
            return '<div class="ws-notice ws-notice-warn">Please <a href="'.home_url('/wholesale-login').'">log in</a> to view wholesale pricing.</div>';
        }
        ob_start(); ?>
        <div class="ws-page" id="ws-catalogue-page">
          <div class="ws-cat-toolbar">
            <div class="ws-cat-info">
              <h2>📦 Wholesale Catalogue</h2>
              <p class="ws-cat-note">All prices exclude VAT. VAT (15%) will be added to your invoice.</p>
            </div>
            <div class="ws-cat-actions">
              <input type="text" id="ws-cat-search" class="ws-search" placeholder="Search products…" oninput="wsCatFilter()">
              <button class="ws-btn ws-btn-wa" onclick="wsSendWAOrder()">📲 Send via WhatsApp</button>
              <button class="ws-btn ws-btn-primary" onclick="wsPlaceOrder()">✓ Place Order</button>
            </div>
          </div>

          <!-- Wholesale terms banner -->
          <div class="ws-terms-banner">
            <span>🏪 Wholesale Price List</span>
            <span>·</span><span>For Pharmacies &amp; Retail Stores</span>
            <span>·</span><span>Prices Exclude VAT</span>
            <span>·</span><span>VAT Added on Invoice</span>
          </div>

          <!-- Cart summary -->
          <div id="ws-cart-bar" class="ws-cart-bar" style="display:none">
            <span id="ws-cart-count">0 items</span>
            <span id="ws-cart-total">N$ 0.00 ex-VAT</span>
            <button class="ws-btn ws-btn-primary ws-btn-sm" onclick="wsPlaceOrder()">Place Order →</button>
            <button class="ws-btn ws-btn-ghost ws-btn-sm" onclick="wsClearCart()">Clear</button>
          </div>

          <div id="ws-cat-loading" class="ws-loading">Loading catalogue…</div>
          <div id="ws-cat-output"></div>

          <!-- Order modal -->
          <div id="ws-order-modal" class="ws-modal" style="display:none">
            <div class="ws-modal-box">
              <div class="ws-modal-hd"><h3>Confirm Order</h3><button onclick="wsCloseModal()" class="ws-modal-close">✕</button></div>
              <div id="ws-order-lines"></div>
              <div class="ws-order-totals" id="ws-order-totals"></div>
              <div class="ws-field" style="margin-top:12px"><label>Order Note (optional)</label><textarea id="ws-order-note" class="ws-inp" rows="2" placeholder="Any special instructions…"></textarea></div>
              <div style="display:flex;gap:10px;margin-top:16px">
                <button class="ws-btn ws-btn-primary ws-btn-full" onclick="wsConfirmOrder()">✓ Confirm Order</button>
                <button class="ws-btn ws-btn-wa ws-btn-full" onclick="wsConfirmOrderWA()">📲 Order via WhatsApp</button>
              </div>
              <div id="ws-order-msg" style="margin-top:10px"></div>
            </div>
          </div>

          <!-- Save list modal -->
          <div id="ws-save-modal" class="ws-modal" style="display:none">
            <div class="ws-modal-box ws-modal-box-sm">
              <div class="ws-modal-hd"><h3>Save Order List</h3><button onclick="document.getElementById('ws-save-modal').style.display='none'" class="ws-modal-close">✕</button></div>
              <div class="ws-field"><label>List Name</label><input type="text" id="ws-save-name" class="ws-inp" placeholder="e.g. Monthly Order"></div>
              <button class="ws-btn ws-btn-primary ws-btn-full" style="margin-top:12px" onclick="wsSaveListConfirm()">Save List</button>
            </div>
          </div>
        </div>
        <?php return ob_get_clean();
    }

    public static function sc_orders() {
        if(!self::is_ws_user()) {
            return '<div class="ws-notice ws-notice-warn">Please <a href="'.home_url('/wholesale-login').'">log in</a> to view your orders.</div>';
        }
        ob_start(); ?>
        <div class="ws-page" id="ws-orders-page">
          <div class="ws-page-hdr">
            <h2>📋 My Orders</h2>
            <a href="<?php echo home_url('/wholesale-catalogue'); ?>" class="ws-btn ws-btn-primary ws-btn-sm">+ New Order</a>
          </div>
          <div id="ws-orders-loading" class="ws-loading">Loading orders…</div>
          <div id="ws-orders-output"></div>
        </div>
        <?php return ob_get_clean();
    }

    public static function sc_invoices() {
        if(!self::is_ws_user()) {
            return '<div class="ws-notice ws-notice-warn">Please <a href="'.home_url('/wholesale-login').'">log in</a> to view your invoices.</div>';
        }
        // Check if viewing a specific invoice
        $inv_id = isset($_GET['ws_invoice']) ? (int)$_GET['ws_invoice'] : 0;
        if($inv_id) {
            $order = wc_get_order($inv_id);
            if($order && $order->get_customer_id()==get_current_user_id()) {
                return self::render_invoice_html($order);
            }
        }
        ob_start(); ?>
        <div class="ws-page" id="ws-invoices-page">
          <h2>🧾 My Invoices</h2>
          <div id="ws-invoices-loading" class="ws-loading">Loading invoices…</div>
          <div id="ws-invoices-output"></div>
        </div>
        <?php return ob_get_clean();
    }

    // ── INVOICE HTML RENDER ────────────────────────────────────────
    private static function render_invoice_html($order) {
        $store  = get_option('hpos_store_name','Hambelela Organic');
        $addr   = get_option('hpos_store_address','Office 1.3, Corner John Muundjua & Julius Nyerere St');
        $city   = get_option('hpos_cat_city','Lazarette House, Ausspannplatz, Windhoek, Namibia');
        $phone  = get_option('hpos_store_phone','+264 856628598');
        $web    = get_option('hpos_cat_website','www.hambelelaorganic.com');
        $vat    = get_option('hpos_vat_number','');
        $user   = get_user_by('id',$order->get_customer_id());
        $biz    = get_user_meta($user->ID,'_ws_business_name',true) ?: $user->display_name;
        $exvat  = (float)get_post_meta($order->get_id(),'_ws_exvat_total',true) ?: ($order->get_total()/1.15);
        $vat_amt= round($exvat*0.15,2);

        ob_start(); ?>
        <div class="ws-invoice" id="ws-invoice-<?php echo $order->get_id(); ?>">
          <div class="ws-inv-actions">
            <button onclick="window.print()" class="ws-btn ws-btn-primary">🖨 Print Invoice</button>
            <a href="<?php echo home_url('/wholesale-invoices'); ?>" class="ws-btn ws-btn-ghost">← Back to Invoices</a>
          </div>
          <div class="ws-inv-doc">
            <div class="ws-inv-head">
              <div class="ws-inv-brand">
                <?php if(get_option('hpos_logo_url')): ?>
                  <img src="<?php echo esc_url(get_option('hpos_logo_url')); ?>" alt="logo" class="ws-inv-logo">
                <?php else: ?>
                  <div class="ws-inv-logo-ph">🌿</div>
                <?php endif; ?>
                <div>
                  <div class="ws-inv-company"><?php echo esc_html($store); ?></div>
                  <div class="ws-inv-addr"><?php echo esc_html($addr); ?><br><?php echo esc_html($city); ?></div>
                  <div class="ws-inv-addr"><?php echo esc_html($phone); ?> · <?php echo esc_html($web); ?></div>
                  <?php if($vat): ?><div class="ws-inv-addr"><?php echo esc_html($vat); ?></div><?php endif; ?>
                </div>
              </div>
              <div class="ws-inv-meta">
                <div class="ws-inv-title">TAX INVOICE</div>
                <table class="ws-inv-meta-tbl">
                  <tr><td>Invoice No.</td><td><strong>#<?php echo $order->get_order_number(); ?></strong></td></tr>
                  <tr><td>Date</td><td><?php echo $order->get_date_created()->format('d M Y'); ?></td></tr>
                  <tr><td>Status</td><td><?php echo ucfirst($order->get_status()); ?></td></tr>
                </table>
              </div>
            </div>

            <div class="ws-inv-parties">
              <div class="ws-inv-party">
                <div class="ws-inv-party-label">BILL TO</div>
                <strong><?php echo esc_html($biz); ?></strong><br>
                <?php echo esc_html($order->get_billing_address_1()); ?><br>
                <?php echo esc_html($order->get_billing_city()); ?><br>
                <?php echo esc_html($order->get_billing_email()); ?>
              </div>
            </div>

            <table class="ws-inv-tbl">
              <thead><tr>
                <th>Product</th><th style="text-align:center">Qty</th>
                <th style="text-align:right">Unit Price (ex-VAT)</th>
                <th style="text-align:right">Line Total (ex-VAT)</th>
              </tr></thead>
              <tbody>
              <?php foreach($order->get_items() as $item):
                $unit = $item->get_total() / max(1,$item->get_quantity()); ?>
                <tr>
                  <td><?php echo esc_html($item->get_name()); ?></td>
                  <td style="text-align:center"><?php echo $item->get_quantity(); ?></td>
                  <td style="text-align:right">N$ <?php echo number_format($unit,2); ?></td>
                  <td style="text-align:right">N$ <?php echo number_format($item->get_total(),2); ?></td>
                </tr>
              <?php endforeach; ?>
              </tbody>
              <tfoot>
                <tr><td colspan="3" style="text-align:right">Sub-total (ex-VAT)</td><td style="text-align:right">N$ <?php echo number_format($exvat,2); ?></td></tr>
                <tr><td colspan="3" style="text-align:right">VAT (15%)</td><td style="text-align:right">N$ <?php echo number_format($vat_amt,2); ?></td></tr>
                <tr class="ws-inv-total-row"><td colspan="3" style="text-align:right"><strong>TOTAL DUE</strong></td><td style="text-align:right"><strong>N$ <?php echo number_format($exvat+$vat_amt,2); ?></strong></td></tr>
              </tfoot>
            </table>

            <div class="ws-inv-footer">
              <p><?php echo esc_html($store); ?> · <?php echo esc_html($web); ?> · <?php echo esc_html($phone); ?></p>
              <p>Thank you for your business.</p>
            </div>
          </div>
        </div>
        <?php return ob_get_clean();
    }

    // ── INVOICE PDF TRIGGER ────────────────────────────────────────
    public static function maybe_generate_invoice() {
        // Print-friendly invoice is just window.print() — handled client-side
    }
}
