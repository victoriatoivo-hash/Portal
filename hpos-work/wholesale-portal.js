<?php
if (!defined('ABSPATH')) exit;

class HPOS_Admin {
    public static function init() {
        add_action('admin_menu',             [__CLASS__, 'register_menu']);
        add_action('admin_enqueue_scripts',  [__CLASS__, 'enqueue']);
        add_action('current_screen',         [__CLASS__, 'kill_notices']);
        add_filter('plugin_action_links_' . plugin_basename(HPOS_PLUGIN_FILE), [__CLASS__, 'plugin_links']);
    }

    public static function kill_notices($screen) {
        if (!$screen || strpos($screen->id, 'hpos') === false) return;
        remove_all_actions('admin_notices');
        remove_all_actions('all_admin_notices');
        add_action('admin_notices', function() { ob_start(); }, 0);
        add_action('admin_notices', function() { ob_end_clean(); }, 9999);
    }

    public static function register_menu() {
        add_menu_page('Hambelela POS', 'POS', 'manage_options', 'hpos', [__CLASS__, 'render'], 'dashicons-store', 25);
        add_submenu_page('hpos','POS Terminal','POS Terminal','manage_options','hpos',[__CLASS__,'render']);
        add_submenu_page('hpos','Orders','Orders','manage_options','hpos-orders',[__CLASS__,'render']);
        add_submenu_page('hpos','On Hold','On Hold','manage_options','hpos-held',[__CLASS__,'render']);
        add_submenu_page('hpos','Inventory','Inventory','manage_options','hpos-inventory',[__CLASS__,'render']);
        add_submenu_page('hpos','Reports','Reports','manage_options','hpos-reports',[__CLASS__,'render']);
        add_submenu_page('hpos','Catalogue Generator','Catalogue Generator','manage_options','hpos-catalogue',[__CLASS__,'render']);
        add_submenu_page('hpos','Wholesale Portal','Wholesale Portal','manage_options','hpos-wholesale',[__CLASS__,'render']);
        add_submenu_page('hpos','Settings','Settings','manage_options','hpos-settings',[__CLASS__,'render']);
    }

    public static function enqueue($hook) {
        if (strpos($hook, 'hpos') === false) return;
        // Inline CSS only — JS is inlined in the page to guarantee it loads
        $css = file_exists(HPOS_DIR . 'assets/css/pos.css') ? file_get_contents(HPOS_DIR . 'assets/css/pos.css') : '';
        if ($css) wp_add_inline_style('wp-admin', $css);
    }

    public static function render() {
        $slug_map = ['hpos'=>'pos','hpos-orders'=>'orders','hpos-held'=>'held','hpos-inventory'=>'inventory','hpos-reports'=>'reports','hpos-catalogue'=>'catalogue','hpos-wholesale'=>'wholesale','hpos-settings'=>'settings'];
        $slug     = isset($_GET['page']) ? sanitize_text_field($_GET['page']) : 'hpos';
        $page     = isset($slug_map[$slug]) ? $slug_map[$slug] : 'pos';

        $data = json_encode([
            'apiUrl'        => rest_url('hpos/v1'),
            'nonce'         => wp_create_nonce('wp_rest'),
            'storeName'     => get_option('hpos_store_name', get_bloginfo('name')),
            'location'      => get_option('hpos_location', 'Windhoek Store'),
            'currency'      => get_option('hpos_currency', 'N$'),
            'vatNumber'     => get_option('hpos_vat_number', ''),
            'storeAddress'  => get_option('hpos_store_address', ''),
            'storePhone'    => get_option('hpos_store_phone', ''),
            'storeEmail'    => get_option('hpos_store_email', get_option('admin_email')),
            'receiptFooter' => get_option('hpos_receipt_footer', 'Thank you!'),
            'logoUrl'       => get_option('hpos_logo_url', ''),
            'staffPin'      => get_option('hpos_staff_pin', ''),
            'reportsPin'    => get_option('hpos_reports_pin', ''),
            'budgetPin'     => get_option('hpos_budget_pin', ''),
            'cashierName'   => wp_get_current_user()->display_name,
            'cashierId'     => get_current_user_id(),
            'siteUrl'       => get_site_url(),
            'currentPage'   => $page,
        ]);

        $js_file  = HPOS_DIR . 'assets/js/pos.js';
        $js_code  = file_exists($js_file) ? file_get_contents($js_file) : '/* POS JS missing */';
        $cat_js   = file_exists(HPOS_DIR.'assets/js/catalogue.js') ? file_get_contents(HPOS_DIR.'assets/js/catalogue.js') : '';
        $ws_js    = ''; // wholesale admin JS is embedded in pos.js catPage/wsAdminPage functions
        ?>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
        <style>
        /* ── FULL VIEWPORT TAKEOVER ── */
        /* Hide WP admin chrome so POS fills the screen */
        #wpadminbar,
        #adminmenuwrap,
        #adminmenuback { display: none !important; }

        html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            height: 100% !important;
        }
        #wpwrap, #wpcontent, #wpbody, #wpbody-content {
            margin: 0 !important;
            padding: 0 !important;
            float: none !important;
            width: 100% !important;
            min-height: 100vh !important;
        }
        /* Remove any WP notices / h1 padding above our POS */
        .wrap, #wpbody-content > .wrap { display: none !important; }
        #hpos-root {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 99999 !important;
            background: #f1f5f9 !important;
            overflow: hidden !important;
        }
        </style>
        <div id="hpos-root" data-page="<?php echo esc_attr($page); ?>">
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#999;">
                <div style="text-align:center;">
                    <div style="font-size:40px;margin-bottom:12px;">🖥</div>
                    <div style="font-size:14px;">Loading POS...</div>
                </div>
            </div>
        </div>
        <script>
        /* Hambelela POS v3 — inline boot */
        window.hposData = <?php echo $data; ?>;
        <?php echo $js_code; ?>
        <?php echo $cat_js; ?>
        </script>
        <?php
    }

    public static function plugin_links($links) {
        array_unshift($links, '<a href="' . admin_url('admin.php?page=hpos') . '" style="font-weight:bold;color:#2e7d52;">🖥 Open POS</a>');
        return $links;
    }
}
