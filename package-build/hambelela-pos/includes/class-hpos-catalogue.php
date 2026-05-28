<?php
if (!defined('ABSPATH')) exit;

class HPOS_Catalogue {

    public static function init() {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        // Add wholesale price field to WC product editor
        add_action('woocommerce_product_options_pricing', [__CLASS__, 'add_wholesale_price_field']);
        add_action('woocommerce_process_product_meta',    [__CLASS__, 'save_wholesale_price_field']);
        add_action('woocommerce_variation_options_pricing', [__CLASS__, 'add_variation_wholesale_field'], 10, 3);
        add_action('woocommerce_save_product_variation',    [__CLASS__, 'save_variation_wholesale_field'], 10, 2);
    }

    public static function register_routes() {
        $n = 'hpos/v1';
        register_rest_route($n, '/catalogue/products',  ['methods'=>'GET',  'callback'=>[__CLASS__,'get_catalogue_products'], 'permission_callback'=>[__CLASS__,'can_admin']]);
        register_rest_route($n, '/catalogue/products/(?P<id>\d+)/wholesale', ['methods'=>'POST','callback'=>[__CLASS__,'save_product_wholesale'],'permission_callback'=>[__CLASS__,'can_admin']]);
        register_rest_route($n, '/catalogue/settings',  ['methods'=>'GET',  'callback'=>[__CLASS__,'get_catalogue_settings'],'permission_callback'=>[__CLASS__,'can_admin']]);
        register_rest_route($n, '/catalogue/settings',  ['methods'=>'POST', 'callback'=>[__CLASS__,'save_catalogue_settings'],'permission_callback'=>[__CLASS__,'can_admin']]);
        // Wholesale portal
        register_rest_route($n, '/wholesale/register',  ['methods'=>'POST', 'callback'=>[__CLASS__,'ws_register'],  'permission_callback'=>'__return_true']);
        register_rest_route($n, '/wholesale/customers', ['methods'=>'GET',  'callback'=>[__CLASS__,'ws_customers'], 'permission_callback'=>[__CLASS__,'can_admin']]);
        register_rest_route($n, '/wholesale/approve',   ['methods'=>'POST', 'callback'=>[__CLASS__,'ws_approve'],   'permission_callback'=>[__CLASS__,'can_admin']]);
        register_rest_route($n, '/wholesale/reject',    ['methods'=>'POST', 'callback'=>[__CLASS__,'ws_reject'],    'permission_callback'=>[__CLASS__,'can_admin']]);
        register_rest_route($n, '/wholesale/catalogue', ['methods'=>'GET',  'callback'=>[__CLASS__,'ws_catalogue'], 'permission_callback'=>[__CLASS__,'ws_can']]);
        register_rest_route($n, '/wholesale/orders',    ['methods'=>'GET',  'callback'=>[__CLASS__,'ws_orders'],    'permission_callback'=>[__CLASS__,'ws_can']]);
        register_rest_route($n, '/wholesale/order',     ['methods'=>'POST', 'callback'=>[__CLASS__,'ws_place_order'],'permission_callback'=>[__CLASS__,'ws_can']]);
        register_rest_route($n, '/wholesale/savedlists',['methods'=>'GET',  'callback'=>[__CLASS__,'ws_get_lists'], 'permission_callback'=>[__CLASS__,'ws_can']]);
        register_rest_route($n, '/wholesale/savedlists',['methods'=>'POST', 'callback'=>[__CLASS__,'ws_save_list'], 'permission_callback'=>[__CLASS__,'ws_can']]);
        register_rest_route($n, '/wholesale/savedlists/(?P<id>\d+)', ['methods'=>'DELETE','callback'=>[__CLASS__,'ws_delete_list'],'permission_callback'=>[__CLASS__,'ws_can']]);
    }

    public static function can_admin() {
        return current_user_can('manage_options') || current_user_can('manage_woocommerce');
    }
    public static function ws_can() {
        if(!is_user_logged_in()) return new WP_Error('unauthorized','Login required',['status'=>401]);
        $u = wp_get_current_user();
        if(in_array('wholesale_customer',$u->roles)||in_array('administrator',$u->roles)||in_array('shop_manager',$u->roles)) return true;
        return new WP_Error('forbidden','Wholesale access required',['status'=>403]);
    }

    // ── WHOLESALE PRICE FIELD IN WC PRODUCT EDITOR ───────────────
    public static function add_wholesale_price_field() {
        woocommerce_wp_text_input([
            'id'          => '_wholesale_price',
            'label'       => __('Wholesale Price (N$)', 'hambelela-pos') . ' <span class="woocommerce-help-tip" data-tip="Price shown to wholesale customers. Excludes VAT. Leave blank to auto-calculate (ex-VAT × 60%)."></span>',
            'placeholder' => 'e.g. 65.00',
            'type'        => 'number',
            'custom_attributes' => ['step'=>'0.01','min'=>'0'],
        ]);
        woocommerce_wp_text_input([
            'id'          => '_suggested_order_qty',
            'label'       => __('Suggested Order Qty', 'hambelela-pos') . ' <span class="woocommerce-help-tip" data-tip="e.g. Most pharmacies order 6 units."></span>',
            'placeholder' => 'e.g. 6',
            'type'        => 'number',
            'custom_attributes' => ['step'=>'1','min'=>'1'],
        ]);
        woocommerce_wp_text_input([
            'id'          => '_moq',
            'label'       => __('Minimum Order Qty (Wholesale)', 'hambelela-pos'),
            'placeholder' => 'e.g. 6',
            'type'        => 'number',
            'custom_attributes' => ['step'=>'1','min'=>'1'],
        ]);
    }
    public static function save_wholesale_price_field($post_id) {
        foreach (['_wholesale_price','_suggested_order_qty','_moq'] as $key) {
            if (isset($_POST[$key])) {
                $val = sanitize_text_field($_POST[$key]);
                update_post_meta($post_id, $key, $val);
            }
        }
    }
    public static function add_variation_wholesale_field($loop, $variation_data, $variation) {
        woocommerce_wp_text_input([
            'id'            => "_variation_wholesale_price_{$variation->ID}",
            'name'          => "variation_wholesale_price[{$loop}]",
            'value'         => get_post_meta($variation->ID,'_wholesale_price',true),
            'label'         => __('Wholesale Price (N$)','hambelela-pos'),
            'type'          => 'number',
            'custom_attributes' => ['step'=>'0.01','min'=>'0'],
        ]);
    }
    public static function save_variation_wholesale_field($variation_id, $i) {
        if (isset($_POST['variation_wholesale_price'][$i])) {
            update_post_meta($variation_id, '_wholesale_price', sanitize_text_field($_POST['variation_wholesale_price'][$i]));
        }
    }

    // ── SAVE SINGLE PRODUCT WHOLESALE FIELDS ─────────────────────
    public static function save_product_wholesale($req) {
        $id = (int)$req->get_param('id');
        if(!$id) return new WP_REST_Response(['error'=>'Invalid product ID'],400);
        $p = $req->get_json_params();

        if(array_key_exists('wholesale_price',$p)){
            $val = $p['wholesale_price'];
            if($val===null||$val==='') delete_post_meta($id,'_wholesale_price');
            else update_post_meta($id,'_wholesale_price', round((float)$val,2));
        }
        if(array_key_exists('moq',$p)){
            $val = $p['moq'];
            if($val===null||$val==='') delete_post_meta($id,'_moq');
            else update_post_meta($id,'_moq',(int)$val);
        }
        if(array_key_exists('suggested_qty',$p)){
            $val = $p['suggested_qty'];
            if($val===null||$val==='') delete_post_meta($id,'_suggested_order_qty');
            else update_post_meta($id,'_suggested_order_qty',(int)$val);
        }
        return new WP_REST_Response([
            'success'         => true,
            'wholesale_price' => (float)get_post_meta($id,'_wholesale_price',true) ?: null,
            'moq'             => (int)get_post_meta($id,'_moq',true) ?: null,
            'suggested_qty'   => (int)get_post_meta($id,'_suggested_order_qty',true) ?: null,
        ]);
    }

    // ── CATALOGUE PRODUCTS API ─────────────────────────────────────
    public static function get_catalogue_products() {
        nocache_headers();
        // Clear WC product caches so prices/stock are always live
        if (function_exists('wc_delete_product_transients')) wc_delete_product_transients();
        if (class_exists('WC_Cache_Helper')) {
            WC_Cache_Helper::invalidate_cache_group('products');
            WC_Cache_Helper::invalidate_cache_group('product_');
        }
        if (function_exists('wp_cache_flush_runtime')) wp_cache_flush_runtime();
        $args = ['status'=>'publish','limit'=>-1,'orderby'=>'menu_order','order'=>'ASC'];
        $products = wc_get_products($args);
        $out = [];
        foreach ($products as $p) {
            $cat_terms = get_the_terms($p->get_id(), 'product_cat');
            $cats = $cat_terms ? array_map(function($t){return $t->name;},$cat_terms) : ['Uncategorised'];
            // Remove 'Uncategorized' WC default if real cats exist
            if(count($cats)>1) $cats = array_filter($cats,function($c){return strtolower($c)!=='uncategorized';});
            $cat = array_values($cats)[0];

            $variations = [];
            $any_var_in_stock = false;
            if($p->is_type('variable')) {
                foreach($p->get_children() as $var_id) {
                    clean_post_cache($var_id);
                    $var = wc_get_product($var_id);
                    if(!$var || $var->get_status() !== 'publish') continue;
                    $var->read_meta_data(true);
                    $ws = (float)get_post_meta($var_id,'_wholesale_price',true) ?: null;

                    $v_manages  = $var->get_manage_stock();
                    $v_qty      = $var->get_stock_quantity();
                    $v_status   = $var->get_stock_status();
                    $v_in_stock = $v_manages
                        ? ($v_qty !== null && $v_qty > 0)
                        : ($v_status === 'instock' || $v_status === 'onbackorder');
                    if ($v_in_stock) $any_var_in_stock = true;

                    $variations[] = [
                        'id'           => $var_id,
                        'name'         => implode(', ', array_values($var->get_attributes())),
                        'price'        => (float)$var->get_price(),
                        'regular_price'=> (float)($var->get_regular_price() ?: $var->get_price()),
                        'ws_price'     => $ws,
                        'sku'          => $var->get_sku(),
                        'stock_qty'    => $v_qty,
                        'stock_status' => $v_status,
                        'in_stock'     => $v_in_stock,
                    ];
                }
            }

            $img_id  = $p->get_image_id();
            $img_url = $img_id ? wp_get_attachment_image_url($img_id,'medium') : '';

            $ws_price = (float)get_post_meta($p->get_id(),'_wholesale_price',true) ?: null;
            $sugg_qty = (int)get_post_meta($p->get_id(),'_suggested_order_qty',true) ?: null;
            $moq      = (int)get_post_meta($p->get_id(),'_moq',true) ?: null;

            $out[] = [
                'id'           => $p->get_id(),
                'name'         => $p->get_name(),
                'sku'          => $p->get_sku(),
                'category'     => $cat,
                'desc'         => wp_strip_all_tags($p->get_short_description() ?: $p->get_description()),
                'image'        => $img_url,
                'price'        => (float)$p->get_price(),
                'regular_price'=> (float)($p->get_regular_price() ?: $p->get_price()),
                'wholesale_price' => $ws_price,
                'suggested_qty'=> $sugg_qty,
                'moq'          => $moq,
                'stock_qty'    => $p->is_type('variable') ? null : $p->get_stock_quantity(),
                // For variable products, derive stock_status from variations (parent value is cached/stale)
                'stock_status' => $p->is_type('variable')
                    ? ($any_var_in_stock ? 'instock' : 'outofstock')
                    : $p->get_stock_status(),
                'type'         => $p->get_type(),
                'variations'   => $variations,
            ];
        }
        return new WP_REST_Response($out);
    }

    // ── CATALOGUE SETTINGS ─────────────────────────────────────────
    public static function get_catalogue_settings() {
        return new WP_REST_Response([
            'store_name'    => get_option('hpos_store_name', get_bloginfo('name')),
            'store_address' => get_option('hpos_store_address','Office 1.3, Corner John Muundjua & Julius Nyerere St'),
            'store_city'    => get_option('hpos_cat_city','Lazarette House, Ausspannplatz, Windhoek, Namibia'),
            'store_phone'   => get_option('hpos_store_phone','+264 856628598'),
            'store_website' => get_option('hpos_cat_website','www.hambelelaorganic.com'),
            'store_tagline' => get_option('hpos_cat_tagline','Natural · Organic · Pure'),
            'store_vat'     => get_option('hpos_vat_number',''),
            'logo_url'      => get_option('hpos_logo_url',''),
        ]);
    }
    public static function save_catalogue_settings($req) {
        $p = $req->get_json_params();
        $map = ['store_name'=>'hpos_store_name','store_address'=>'hpos_store_address','store_city'=>'hpos_cat_city',
                'store_phone'=>'hpos_store_phone','store_website'=>'hpos_cat_website','store_tagline'=>'hpos_cat_tagline',
                'store_vat'=>'hpos_vat_number','logo_url'=>'hpos_logo_url'];
        foreach($map as $k=>$opt) if(isset($p[$k])) update_option($opt, sanitize_text_field($p[$k]));
        return new WP_REST_Response(['success'=>true]);
    }

    // ── WHOLESALE REGISTRATION ─────────────────────────────────────
    public static function ws_register($req) {
        $p = $req->get_json_params();
        $required = ['business_name','contact_person','email','phone','city','business_type'];
        foreach($required as $f) {
            if(empty($p[$f])) return new WP_REST_Response(['error'=>ucfirst(str_replace('_',' ',$f)).' is required'],400);
        }
        $email = sanitize_email($p['email']);
        if(!is_email($email)) return new WP_REST_Response(['error'=>'Invalid email address'],400);
        if(email_exists($email)) return new WP_REST_Response(['error'=>'An account with this email already exists'],409);

        global $wpdb;
        $wpdb->insert($wpdb->prefix.'hpos_ws_applications',[
            'business_name'  => sanitize_text_field($p['business_name']),
            'contact_person' => sanitize_text_field($p['contact_person']),
            'email'          => $email,
            'phone'          => sanitize_text_field($p['phone']),
            'city'           => sanitize_text_field($p['city']),
            'business_type'  => sanitize_text_field($p['business_type']),
            'status'         => 'pending',
            'created_at'     => current_time('mysql'),
        ]);

        // Notify admin
        wp_mail(get_option('admin_email'),
            'New Wholesale Application — '.$p['business_name'],
            "A new wholesale application has been submitted.\n\nBusiness: {$p['business_name']}\nContact: {$p['contact_person']}\nEmail: {$email}\nPhone: {$p['phone']}\nCity: {$p['city']}\nType: {$p['business_type']}\n\nLog in to approve: ".admin_url('admin.php?page=hpos-wholesale')
        );

        return new WP_REST_Response(['success'=>true,'message'=>'Application submitted. We will be in touch within 1-2 business days.']);
    }

    // ── WHOLESALE ADMIN: LIST CUSTOMERS ────────────────────────────
    public static function ws_customers() {
        global $wpdb;
        $apps = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}hpos_ws_applications ORDER BY created_at DESC");
        return new WP_REST_Response($apps);
    }

    // ── WHOLESALE ADMIN: APPROVE ────────────────────────────────────
    public static function ws_approve($req) {
        global $wpdb;
        $id  = (int)($req->get_json_params()['id'] ?? 0);
        $app = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}hpos_ws_applications WHERE id=%d",$id));
        if(!$app) return new WP_REST_Response(['error'=>'Application not found'],404);

        // Create WP user with wholesale_customer role
        $password = wp_generate_password(12,false);
        $user_id  = wp_create_user($app->email, $password, $app->email);
        if(is_wp_error($user_id)) {
            // User may already exist
            $user_id = get_user_by('email',$app->email)->ID ?? 0;
        }
        if($user_id) {
            $user = new WP_User($user_id);
            $user->set_role('wholesale_customer');
            update_user_meta($user_id,'_ws_business_name', $app->business_name);
            update_user_meta($user_id,'_ws_business_type', $app->business_type);
            update_user_meta($user_id,'_ws_phone',         $app->phone);
            update_user_meta($user_id,'_ws_city',          $app->city);
        }

        $wpdb->update($wpdb->prefix.'hpos_ws_applications',
            ['status'=>'approved','user_id'=>$user_id,'approved_at'=>current_time('mysql')],
            ['id'=>$id]);

        // Email customer
        wp_mail($app->email,
            'Wholesale Account Approved — Hambelela Organic',
            "Dear {$app->contact_person},\n\nYour wholesale account for {$app->business_name} has been approved.\n\nYou can now log in at: ".home_url('/wholesale-login')."\n\nEmail: {$app->email}\nTemporary Password: {$password}\n\nPlease change your password after first login.\n\nWarm regards,\nHambelela Organic\n".get_option('hpos_store_phone','+264 856628598')
        );

        return new WP_REST_Response(['success'=>true,'user_id'=>$user_id]);
    }

    // ── WHOLESALE ADMIN: REJECT ─────────────────────────────────────
    public static function ws_reject($req) {
        global $wpdb;
        $id = (int)($req->get_json_params()['id'] ?? 0);
        $app = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}hpos_ws_applications WHERE id=%d",$id));
        if(!$app) return new WP_REST_Response(['error'=>'Not found'],404);
        $wpdb->update($wpdb->prefix.'hpos_ws_applications',['status'=>'rejected'],['id'=>$id]);
        wp_mail($app->email,'Wholesale Application — Hambelela Organic',
            "Dear {$app->contact_person},\n\nThank you for your interest in Hambelela Organic wholesale.\n\nUnfortunately we are unable to approve your application at this time.\n\nPlease contact us if you have any questions.\n\n+264 856628598\nwww.hambelelaorganic.com");
        return new WP_REST_Response(['success'=>true]);
    }

    // ── WHOLESALE CATALOGUE ─────────────────────────────────────────
    public static function ws_catalogue() {
        // Reuse product fetch, but return all prices including wholesale
        return self::get_catalogue_products();
    }

    // ── WHOLESALE ORDERS ────────────────────────────────────────────
    public static function ws_orders() {
        $user_id = get_current_user_id();
        $orders  = wc_get_orders(['customer_id'=>$user_id,'limit'=>50,'orderby'=>'date','order'=>'DESC']);
        $out = [];
        foreach($orders as $o) {
            $out[] = [
                'id'       => $o->get_id(),
                'number'   => $o->get_order_number(),
                'date'     => $o->get_date_created()->format('Y-m-d'),
                'total'    => (float)$o->get_total(),
                'status'   => $o->get_status(),
                'items'    => count($o->get_items()),
                'invoice_url' => add_query_arg(['ws_invoice'=>$o->get_id(),'uid'=>$user_id], home_url('/wholesale-invoices')),
            ];
        }
        return new WP_REST_Response($out);
    }

    // ── WHOLESALE PLACE ORDER ───────────────────────────────────────
    public static function ws_place_order($req) {
        $p     = $req->get_json_params();
        $items = $p['items'] ?? [];
        $note  = sanitize_text_field($p['note'] ?? '');
        if(empty($items)) return new WP_REST_Response(['error'=>'No items provided'],400);

        $order = wc_create_order(['customer_id'=>get_current_user_id(),'status'=>'pending']);
        $total = 0;
        foreach($items as $item) {
            $product = wc_get_product((int)$item['product_id']);
            if(!$product) continue;
            $qty     = max(1,(int)$item['qty']);
            $ws_p    = (float)(get_post_meta($product->get_id(),'_wholesale_price',true) ?: ($product->get_price()/1.15*0.6));
            $order->add_product($product,$qty,['subtotal'=>$ws_p*$qty,'total'=>$ws_p*$qty]);
            $total  += $ws_p * $qty;
        }
        $vat = round($total * 0.15, 2);
        $order->set_total($total + $vat);
        $order->add_order_note('Wholesale order via B2B Portal. Ex-VAT: N$'.number_format($total,2).'. VAT: N$'.number_format($vat,2).'. '.$note);
        $order->update_meta_data('_is_wholesale_order','yes');
        $order->update_meta_data('_ws_exvat_total', $total);
        $order->save();

        // WA message
        $lines = [];
        foreach($items as $item) {
            $prd = wc_get_product((int)$item['product_id']);
            if($prd) $lines[] = '• '.$prd->get_name().' × '.$item['qty'];
        }
        $wa_msg = '🌿 *Wholesale Order Request — '.get_option('hpos_store_name','Hambelela Organic')."*\n\n".implode("\n",$lines)."\n\n*Order #".$order->get_order_number()."*\nEx-VAT: N$ ".number_format($total,2)."\nVAT (15%): N$ ".number_format($vat,2)."\nTotal: N$ ".number_format($total+$vat,2);

        return new WP_REST_Response(['success'=>true,'order_id'=>$order->get_id(),'order_number'=>$order->get_order_number(),'wa_message'=>$wa_msg,'wa_url'=>'https://wa.me/264856628598?text='.urlencode($wa_msg)]);
    }

    // ── SAVED ORDER LISTS ───────────────────────────────────────────
    public static function ws_get_lists() {
        $uid   = get_current_user_id();
        $lists = get_user_meta($uid,'_ws_saved_lists',true) ?: [];
        return new WP_REST_Response($lists);
    }
    public static function ws_save_list($req) {
        $uid  = get_current_user_id();
        $p    = $req->get_json_params();
        $name = sanitize_text_field($p['name'] ?? 'My List');
        $items= $p['items'] ?? [];
        $lists= get_user_meta($uid,'_ws_saved_lists',true) ?: [];
        $lists[] = ['id'=>time(),'name'=>$name,'items'=>$items,'created'=>date('Y-m-d')];
        update_user_meta($uid,'_ws_saved_lists',$lists);
        return new WP_REST_Response(['success'=>true,'lists'=>$lists]);
    }
    public static function ws_delete_list($req) {
        $uid   = get_current_user_id();
        $lid   = (int)$req->get_param('id');
        $lists = get_user_meta($uid,'_ws_saved_lists',true) ?: [];
        $lists = array_values(array_filter($lists,function($l) use($lid){return (int)$l['id']!==$lid;}));
        update_user_meta($uid,'_ws_saved_lists',$lists);
        return new WP_REST_Response(['success'=>true,'lists'=>$lists]);
    }
}
