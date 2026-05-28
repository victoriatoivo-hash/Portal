<?php
if (!defined('ABSPATH')) exit;

class HPOS_API {
    public static function init() {
        add_action('rest_api_init', [__CLASS__, 'routes']);
    }
    public static function can() {
        return current_user_can('manage_options') || current_user_can('manage_woocommerce');
    }
    public static function routes() {
        $n = 'hpos/v1';
        register_rest_route($n,'/products',            ['methods'=>'GET', 'callback'=>[__CLASS__,'products'],        'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/customers',           ['methods'=>'GET', 'callback'=>[__CLASS__,'customers'],       'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/customers',           ['methods'=>'POST','callback'=>[__CLASS__,'create_customer'], 'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/shipping',            ['methods'=>'GET', 'callback'=>[__CLASS__,'shipping'],        'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/statuses',            ['methods'=>'GET', 'callback'=>[__CLASS__,'statuses'],        'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/orders',              ['methods'=>'GET', 'callback'=>[__CLASS__,'orders'],          'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/orders',              ['methods'=>'POST','callback'=>[__CLASS__,'create_order'],    'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/orders/(?P<id>\d+)', ['methods'=>'PUT', 'callback'=>[__CLASS__,'update_order'],    'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/inventory',           ['methods'=>'GET', 'callback'=>[__CLASS__,'inventory'],       'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/inventory/(?P<id>\d+)',['methods'=>'PUT','callback'=>[__CLASS__,'update_stock'],    'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/inventory-cost/(?P<id>\d+)',['methods'=>'PUT','callback'=>[__CLASS__,'update_cost'],'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/reports',             ['methods'=>'GET', 'callback'=>[__CLASS__,'reports'],         'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/settings',            ['methods'=>'GET', 'callback'=>[__CLASS__,'get_settings'],    'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/settings',            ['methods'=>'POST','callback'=>[__CLASS__,'save_settings'],   'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/budget',              ['methods'=>'GET', 'callback'=>[__CLASS__,'get_budget'],      'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/budget',              ['methods'=>'POST','callback'=>[__CLASS__,'save_budget'],     'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/budget-sales',        ['methods'=>'GET', 'callback'=>[__CLASS__,'budget_sales'],    'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/quotes',               ['methods'=>'GET', 'callback'=>[__CLASS__,'get_quotes'],      'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/quotes',               ['methods'=>'POST','callback'=>[__CLASS__,'create_quote'],    'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/quotes/(?P<id>\d+)',   ['methods'=>'PUT', 'callback'=>[__CLASS__,'update_quote'],    'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/quotes/(?P<id>\d+)',   ['methods'=>'DELETE','callback'=>[__CLASS__,'delete_quote'],  'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/quotes/(?P<id>\d+)/convert',['methods'=>'POST','callback'=>[__CLASS__,'convert_quote'],'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/coupon',              ['methods'=>'GET', 'callback'=>[__CLASS__,'coupon'],           'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/refund',              ['methods'=>'POST','callback'=>[__CLASS__,'create_refund'],    'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/refunds',             ['methods'=>'GET', 'callback'=>[__CLASS__,'refund_list'],      'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/inventory-log',       ['methods'=>'GET', 'callback'=>[__CLASS__,'inventory_log'],    'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/daily-summary',       ['methods'=>'GET', 'callback'=>[__CLASS__,'daily_summary'],    'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/activity-log',        ['methods'=>'GET', 'callback'=>[__CLASS__,'activity_log'],     'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/activity-log',        ['methods'=>'POST','callback'=>[__CLASS__,'log_activity'],     'permission_callback'=>[__CLASS__,'can']]);
        register_rest_route($n,'/price-check',         ['methods'=>'POST','callback'=>[__CLASS__,'price_check'],      'permission_callback'=>[__CLASS__,'can']]);
    }

    // ── PRODUCTS ──────────────────────────────────────────────────
    public static function products($req) {
        // Prevent browser/proxy caching of product responses
        nocache_headers();

        // On forced reload (_t param present), clear all relevant WC/WP caches
        if ($req->get_param('_t')) {
            // Clear WP object cache groups used by WooCommerce products
            if (function_exists('wp_cache_flush_runtime')) wp_cache_flush_runtime();
            wp_cache_delete('wc_products_onsale', 'product');
            wp_cache_delete('wc_product_loop', 'products');

            // Clear WooCommerce product transients (used for variation price caching)
            if (function_exists('wc_delete_product_transients')) {
                wc_delete_product_transients();
            }
            // Clear the WC cache helper group
            if (class_exists('WC_Cache_Helper')) {
                WC_Cache_Helper::invalidate_cache_group('products');
                WC_Cache_Helper::invalidate_cache_group('product_');
            }
        }

        $limit = intval($req->get_param('limit') ?: 500);
        $products = wc_get_products(['status'=>'publish','limit'=>min($limit, 2000)]);
        return new WP_REST_Response(array_map([__CLASS__,'fmt_product'], $products));
    }
    private static function fmt_product($p) {
        // Force-clear this product from WP object cache so we always read live DB values
        clean_post_cache($p->get_id());
        $p->read_meta_data(true); // force reload meta from DB

        $img = $p->get_image_id() ? wp_get_attachment_image_url($p->get_image_id(),'medium') : wc_placeholder_img_src();
        $cats = [];
        foreach ($p->get_category_ids() as $cid) {
            $t = get_term($cid,'product_cat');
            if ($t && !is_wp_error($t)) $cats[] = $t->name;
        }

        $out = ['id'=>$p->get_id(),'name'=>$p->get_name(),'sku'=>$p->get_sku(),'type'=>$p->get_type(),
            'price'=>(float)$p->get_price(),
            'regular_price'=>(float)($p->get_regular_price() ?: $p->get_price()),
            'stock_qty'=>$p->get_stock_quantity(),'stock_status'=>$p->get_stock_status(),
            'manage_stock'=>$p->get_manage_stock(),'image'=>$img,'categories'=>$cats,'variations'=>[]];

        if ($p->get_type()==='variable') {
            $out['price'] = (float)$p->get_variation_price('min');
            $any_in_stock = false;
            $all_out_of_stock = true;

            foreach ($p->get_children() as $vid) {
                // Force-clear each variation from cache so stock is live
                clean_post_cache($vid);
                $v = wc_get_product($vid);
                if (!$v || !$v->is_purchasable()) continue;

                $v->read_meta_data(true); // force reload variation meta

                $attrs = [];
                foreach ($v->get_variation_attributes() as $k=>$val) {
                    $tax = str_replace('attribute_','',$k);
                    $term = get_term_by('slug',$val,$tax);
                    $attrs[wc_attribute_label($tax)] = $term ? $term->name : $val;
                }
                $vi = $v->get_image_id() ? wp_get_attachment_image_url($v->get_image_id(),'medium') : $img;

                // Determine variation stock status accurately:
                // A variation is IN stock if either:
                //   (a) it does not manage stock and stock_status = 'instock', OR
                //   (b) it manages stock and stock_qty > 0
                $v_manages = $v->get_manage_stock();
                $v_qty     = $v->get_stock_quantity();
                $v_status  = $v->get_stock_status(); // 'instock' | 'outofstock' | 'onbackorder'
                $v_in_stock = $v_manages
                    ? ($v_qty !== null && $v_qty > 0)
                    : ($v_status === 'instock' || $v_status === 'onbackorder');

                if ($v_in_stock) { $any_in_stock = true; $all_out_of_stock = false; }

                $out['variations'][] = [
                    'id'           => $v->get_id(),
                    'attributes'   => $attrs,
                    'price'        => (float)$v->get_price(),
                    'regular_price'=> (float)($v->get_regular_price() ?: $v->get_price()),
                    'sku'          => $v->get_sku(),
                    'stock_qty'    => $v_qty,
                    'stock_status' => $v_status,
                    'manage_stock' => $v_manages,
                    'in_stock'     => $v_in_stock,  // explicit boolean for JS
                    'image'        => $vi,
                ];
            }

            // Override parent stock_status based on actual variation stock
            // (parent stock_status is a cached meta value and is often stale)
            $out['stock_status'] = $any_in_stock ? 'instock' : 'outofstock';
            $out['stock_qty']    = null; // variable products don't have a single qty
            $out['has_in_stock_variation'] = $any_in_stock;
        }

        return $out;
    }

    // ── CUSTOMERS ─────────────────────────────────────────────────
    public static function customers($req) {
        $args = ['role__in'=>['customer','subscriber','administrator','shop_manager'],'number'=>200];
        $q = sanitize_text_field($req->get_param('q')||'');
        if ($q) { $args['search']='*'.$q.'*'; $args['search_columns']=['user_login','user_email','display_name']; }
        $users = get_users($args);
        return new WP_REST_Response(array_map(function($u){ return self::fmt_customer($u->ID); }, $users));
    }
    private static function fmt_customer($uid) {
        $u = get_userdata($uid);
        $b = [];
        foreach (['first_name','last_name','phone','company','address_1','address_2','city','state','postcode','country'] as $f)
            $b[$f] = get_user_meta($uid,'billing_'.$f,true);
        $s = [];
        foreach (['first_name','last_name','company','address_1','address_2','city','state','postcode','country'] as $f)
            $s[$f] = get_user_meta($uid,'shipping_'.$f,true);
        return ['id'=>$uid,'name'=>$u->display_name,'email'=>$u->user_email,
            'phone'=>$b['phone'],'billing'=>$b,'shipping'=>$s,
            'loyalty_points'=>(int)get_user_meta($uid,'hpos_loyalty_points',true),
            'total_spent'=>wc_get_customer_total_spent($uid),'order_count'=>wc_get_customer_order_count($uid)];
    }
    public static function create_customer($req) {
        $p = $req->get_json_params();
        $raw_email = trim($p['email'] ?? '');

        // Try sanitize_email first; fall back to raw if it contains @ (POS placeholder emails)
        $email = sanitize_email($raw_email);
        if (!$email && strpos($raw_email, '@') !== false) {
            $email = $raw_email; // accept POS-generated placeholder like pos.123@hambelela.customer
        }
        if (!$email) {
            return new WP_REST_Response(['error' => 'A valid email address is required.'], 400);
        }

        if (email_exists($email)) {
            $uid = email_exists($email);
        } else {
            $uid = wc_create_new_customer($email, $email, wp_generate_password());
            if (is_wp_error($uid)) {
                return new WP_REST_Response(['error' => $uid->get_error_message()], 400);
            }
        }
        $fields = ['billing_first_name','billing_last_name','billing_phone','billing_company','billing_address_1','billing_address_2','billing_city','billing_state','billing_postcode','billing_country','shipping_first_name','shipping_last_name','shipping_company','shipping_address_1','shipping_address_2','shipping_city','shipping_state','shipping_postcode','shipping_country'];
        foreach ($fields as $f) if (isset($p[$f])) update_user_meta($uid,$f,sanitize_text_field($p[$f]));
        $name = trim(($p['billing_first_name']??'').' '.($p['billing_last_name']??''));
        update_user_meta($uid,'first_name',$p['billing_first_name']??'');
        update_user_meta($uid,'last_name',$p['billing_last_name']??'');
        if ($name) { global $wpdb; $wpdb->update($wpdb->users,['display_name'=>$name],['ID'=>$uid]); }
        if (!get_user_meta($uid,'hpos_loyalty_points',true)) update_user_meta($uid,'hpos_loyalty_points',0);
        return new WP_REST_Response(self::fmt_customer($uid), 201);
    }

    // ── SHIPPING ──────────────────────────────────────────────────
    public static function shipping() {
        $data = [];
        $zones = WC_Shipping_Zones::get_zones();
        $z0 = new WC_Shipping_Zone(0);
        foreach ($z0->get_shipping_methods(true) as $m) {
            if (!$m->is_enabled()) continue;
            $data[] = ['zone_id'=>0,'zone_name'=>'Rest of World','method_id'=>$m->get_instance_id(),'method_type'=>$m->id,'title'=>$m->get_title(),'cost'=>(float)($m->cost??$m->get_option('cost',0))];
        }
        foreach ($zones as $zd) {
            $zone = new WC_Shipping_Zone($zd['zone_id']);
            foreach ($zone->get_shipping_methods(true) as $m) {
                if (!$m->is_enabled()) continue;
                $data[] = ['zone_id'=>$zd['zone_id'],'zone_name'=>$zd['zone_name'],'method_id'=>$m->get_instance_id(),'method_type'=>$m->id,'title'=>$m->get_title(),'cost'=>(float)$m->get_option('cost',0)];
            }
        }
        $data[] = ['zone_id'=>-1,'zone_name'=>'In-Store','method_id'=>'pickup','method_type'=>'local_pickup','title'=>'In-Store Pickup','cost'=>0];
        return new WP_REST_Response($data);
    }

    // ── STATUSES ──────────────────────────────────────────────────
    public static function statuses() {
        $out = [];
        foreach (wc_get_order_statuses() as $k=>$l) $out[] = ['key'=>str_replace('wc-','',$k),'label'=>$l];
        return new WP_REST_Response($out);
    }

    // ── ORDERS ────────────────────────────────────────────────────
    public static function orders($req) {
        $args = ['limit'=>300,'orderby'=>'date','order'=>'DESC','status'=>array_keys(wc_get_order_statuses())];
        if ($req->get_param('status')) $args['status'] = [$req->get_param('status')];
        return new WP_REST_Response(array_map([__CLASS__,'fmt_order'], wc_get_orders($args)));
    }
    public static function fmt_order($o) {
        $items = [];
        foreach ($o->get_items() as $i) {
            $items[] = ['id'=>$i->get_id(),'product_id'=>$i->get_product_id(),'variation_id'=>$i->get_variation_id(),
                'name'=>$i->get_name(),'qty'=>$i->get_quantity(),'price'=>(float)$o->get_item_total($i),'total'=>(float)$i->get_total()];
        }
        $ship = [];
        foreach ($o->get_items('shipping') as $s) $ship[] = ['title'=>$s->get_name(),'cost'=>(float)$s->get_total()];
        return ['id'=>$o->get_id(),'number'=>$o->get_order_number(),'status'=>$o->get_status(),
            'total'=>(float)$o->get_total(),'subtotal'=>(float)$o->get_subtotal(),
            'total_tax'=>(float)$o->get_total_tax(),'shipping_total'=>(float)$o->get_shipping_total(),
            'discount_total'=>(float)$o->get_discount_total(),
            'payment_method'=>$o->get_payment_method(),'payment_title'=>$o->get_payment_method_title(),
            'cashier'=>$o->get_meta('_hpos_cashier_name'),'is_pos'=>(bool)$o->get_meta('_hpos_sale'),
            'date'=>$o->get_date_created()?$o->get_date_created()->format('Y-m-d H:i:s'):'',
            'items'=>$items,'shipping'=>$ship,'billing'=>$o->get_address('billing'),'shipping_address'=>$o->get_address('shipping'),
            'note'=>$o->get_customer_note(),'payment_split'=>json_decode($o->get_meta('_hpos_split')?:'[]',true)];
    }
    public static function create_order($req) {
        global $wpdb;
        $p = $req->get_json_params();

        // Prevent WooCommerce hooks from auto-changing the order status.
        // The woocommerce_payment_complete_order_status filter fires when
        // payment_complete() is called and can force status=completed.
        // We suppress it for the duration of this request by forcing it
        // to return whatever status the POS user chose.
        $requested_status = sanitize_text_field($p['status'] ?? 'processing');
        $status_filter = function() use ($requested_status) { return $requested_status; };
        add_filter('woocommerce_payment_complete_order_status', $status_filter, 99);

        $order = wc_create_order(['customer_id' => intval($p['customer_id'] ?? 0), 'status' => 'pending']);
        if (is_wp_error($order)) {
            remove_filter('woocommerce_payment_complete_order_status', $status_filter, 99);
            return new WP_REST_Response(['error' => $order->get_error_message()], 400);
        }

        // ── DISABLE WC AUTO STOCK REDUCTION ──────────────────────
        // We manually reduce stock per-item below using wc_update_product_stock().
        // WooCommerce also fires wc_maybe_reduce_stock_levels() when order status
        // transitions to processing/completed, which would deduct stock a SECOND
        // time. We block that by filtering woocommerce_can_reduce_order_stock.
        add_filter('woocommerce_can_reduce_order_stock', '__return_false', 99);

        // Prices from POS are VAT-INCLUSIVE (15%).
        // WooCommerce stores line items as ex-VAT internally.
        // IMPORTANT: We must set subtotal/total AFTER set_product() because
        // set_product() internally calls set_subtotal/set_total from the product's
        // current price — which may be a WooCommerce sale price. By setting our
        // explicit values last, we ensure the POS price always wins.

        $VAT_DIV      = 1.15;
        $TAX_KEY      = 1;
        $order_ex_sum = 0.0;
        $order_tax    = 0.0;
        $order_disc   = floatval($p['discount'] ?? 0);
        $order_ship   = 0.0;

        // ── LINE ITEMS ────────────────────────────────────────────
        foreach (($p['items'] ?? []) as $item) {
            $raw_id       = $item['id'] ?? 0;
            $variation_id = intval($item['variation_id'] ?? 0);
            $is_custom    = !is_numeric($raw_id) || intval($raw_id) === 0;

            // Always resolve to the most specific product for stock management:
            // for variations, use the variation object (not the parent).
            $stock_product = null;
            $product       = null;
            if (!$is_custom) {
                if ($variation_id > 0) {
                    $var_obj = wc_get_product($variation_id);
                    if ($var_obj && $var_obj->is_type('variation')) {
                        $stock_product = $var_obj; // reduce variation stock
                        $product       = $var_obj; // also use for order item
                    }
                }
                if (!$product) {
                    $product       = wc_get_product(intval($raw_id));
                    $stock_product = $product;
                }
            }

            $qty  = max(1, intval($item['qty']));
            // Use the price explicitly sent by the POS — never recalculate from product
            $incl = round(floatval($item['price']) * $qty, 6); // VAT-inclusive line total
            $ex   = round($incl / $VAT_DIV, 6);
            $tax  = round($incl - $ex, 6);

            $li = new WC_Order_Item_Product();

            if ($product) {
                // set_product() sets name, product_id, variation_id, SKU
                $li->set_product($product);
                if ($variation_id > 0) {
                    $li->set_variation_id($variation_id);
                }
                // ── STOCK REDUCTION: variation-level if variation manages stock,
                //    else parent-level if parent manages stock.
                //    Never reduce at BOTH levels.
                if ($stock_product && $stock_product->get_manage_stock()) {
                    // Variation manages its own stock
                    wc_update_product_stock($stock_product, $qty, 'decrease');
                } elseif ($variation_id > 0) {
                    // Variation doesn't manage stock — try the parent
                    $parent = wc_get_product(intval($raw_id));
                    if ($parent && $parent->get_manage_stock()) {
                        wc_update_product_stock($parent, $qty, 'decrease');
                    }
                } elseif ($product->get_manage_stock()) {
                    wc_update_product_stock($product, $qty, 'decrease');
                }
            } else {
                $li->set_name(sanitize_text_field($item['name'] ?? 'Custom Item'));
                $li->set_product_id(0);
                $li->set_variation_id(0);
            }

            // Always set these AFTER set_product() so our POS values win
            $li->set_quantity($qty);
            $li->set_subtotal($ex);   // ex-VAT, must come after set_product()
            $li->set_total($ex);      // ex-VAT, must come after set_product()
            $li->set_taxes(['subtotal' => [$TAX_KEY => $tax], 'total' => [$TAX_KEY => $tax]]);
            $order->add_item($li);

            $order_ex_sum += $ex;
            $order_tax    += $tax;
        }

        // ── SHIPPING ─────────────────────────────────────────────
        if (!empty($p['shipping']) && floatval($p['shipping']['cost'] ?? 0) > 0) {
            $order_ship = floatval($p['shipping']['cost']);
            $si = new WC_Order_Item_Shipping();
            $si->set_name(sanitize_text_field($p['shipping']['title'] ?? 'Shipping'));
            $si->set_total($order_ship);
            $si->set_taxes(['total' => []]);
            $si->set_method_id(sanitize_text_field($p['shipping']['method_type'] ?? 'flat_rate'));
            $order->add_item($si);
        }

        // ── DISCOUNT ─────────────────────────────────────────────
        if ($order_disc > 0) {
            $disc_ex  = round($order_disc / $VAT_DIV, 6);
            $disc_tax = round($order_disc - $disc_ex, 6);
            $fi = new WC_Order_Item_Fee();
            $fi->set_name('Discount');
            $fi->set_amount(-$disc_ex);
            $fi->set_total(-$disc_ex);
            $fi->set_taxes(['total' => [$TAX_KEY => -$disc_tax]]);
            $order->add_item($fi);
            $order_ex_sum -= $disc_ex;
            $order_tax    -= $disc_tax;
        }

        // ── ORDER TOTALS ─────────────────────────────────────────
        // calculate_totals(false) sums items — we then immediately override
        // the grand total so it exactly matches the POS display (no double-discount).
        $order->calculate_totals(false);
        $grand_total = round($order_ex_sum + $order_tax + $order_ship, 2);
        $order->set_total($grand_total);
        // Also lock subtotal/tax fields so WC reports show correct values
        $order->set_cart_tax(round($order_tax, 2));
        $order->set_shipping_total(round($order_ship, 2));

        // ── ADDRESSES, META & PAYMENT ─────────────────────────────
        foreach (['billing', 'shipping'] as $t) {
            if (!empty($p[$t . '_address'])) {
                $order->set_address(array_map('sanitize_text_field', $p[$t . '_address']), $t);
            }
        }
        $order->set_payment_method(sanitize_text_field($p['payment_method'] ?? 'cash'));
        $order->set_payment_method_title(sanitize_text_field($p['payment_method_title'] ?? 'Cash'));
        $order->update_meta_data('_hpos_sale', true);
        $order->update_meta_data('_hpos_cashier_id', get_current_user_id());
        $order->update_meta_data('_hpos_cashier_name', wp_get_current_user()->display_name);
        $order->update_meta_data('_hpos_location', get_option('hpos_location', 'Main'));
        $order->update_meta_data('_hpos_split', json_encode($p['payment_split'] ?? []));
        // Set created_via so WooCommerce Origin column shows "POS" instead of "Unknown"
        $order->set_created_via('pos');
        if (!empty($p['note'])) $order->add_order_note(sanitize_textarea_field($p['note']), 0);

        // Mark stock as already reduced so WooCommerce never auto-deducts again.
        // This flag is checked by wc_maybe_reduce_stock_levels() and by any
        // periodic WC stock recalculation (e.g. from the WC status page).
        $order->update_meta_data('_wc_stock_reduced', 1);

        // ── STATUS: always respect what the POS user chose ───────
        $order->set_status($requested_status);
        $order->save();

        // Remove our filters now that the order is saved
        remove_filter('woocommerce_payment_complete_order_status', $status_filter, 99);
        remove_filter('woocommerce_can_reduce_order_stock', '__return_false', 99);

        $wpdb->insert($wpdb->prefix . 'hpos_transactions', [
            'order_id'       => $order->get_id(),
            'cashier_id'     => get_current_user_id(),
            'payment_method' => $p['payment_method'] ?? 'cash',
            'amount'         => $grand_total,
            'discount'       => $order_disc,
            'tax'            => round($order_tax, 2),
            'location'       => get_option('hpos_location', 'Main'),
        ]);

        $cid = intval($p['customer_id'] ?? 0);
        if ($cid > 0) {
            update_user_meta($cid, 'hpos_loyalty_points',
                (int) get_user_meta($cid, 'hpos_loyalty_points', true) + floor($grand_total / 10));
        }

        return new WP_REST_Response([
            'success'      => true,
            'order_id'     => $order->get_id(),
            'order_number' => $order->get_order_number(),
            'total'        => $order->get_total(),
            'status'       => $order->get_status(),
        ], 201);
    }
    public static function update_order($req) {
        $o = wc_get_order(intval($req->get_param('id')));
        if (!$o) return new WP_REST_Response(['error'=>'Not found'],404);
        $p = $req->get_json_params();

        // Block WC from auto-reducing stock again when status changes
        add_filter('woocommerce_can_reduce_order_stock', '__return_false', 99);
        // Ensure _wc_stock_reduced stays marked so WC never re-triggers it
        $o->update_meta_data('_wc_stock_reduced', 1);

        if (!empty($p['status']))
            $o->set_status(sanitize_text_field($p['status']));

        if (!empty($p['payment_method'])) {
            $o->set_payment_method(sanitize_text_field($p['payment_method']));
            $o->set_payment_method_title(sanitize_text_field($p['payment_method_title'] ?? $p['payment_method']));
        }

        if (!empty($p['billing_address']))
            $o->set_address(array_map('sanitize_text_field', $p['billing_address']), 'billing');

        if (!empty($p['shipping_address']))
            $o->set_address(array_map('sanitize_text_field', $p['shipping_address']), 'shipping');

        // Update shipping from the edited payload so totals are rebuilt from current values.
        $edited_ship_total = null;
        if (!empty($p['shipping_title'])) {
            foreach ($o->get_items('shipping') as $item_id => $ship_item) {
                $o->remove_item($item_id);
            }
            $edited_ship_total = round((float)($p['shipping_cost'] ?? 0), 2);
            if ($edited_ship_total > 0 || !empty($p['shipping_title'])) {
                $si = new WC_Order_Item_Shipping();
                $si->set_name(sanitize_text_field($p['shipping_title']));
                $si->set_total($edited_ship_total);
                $si->set_taxes(['total' => []]);
                $si->set_method_id('hpos_edit');
                $o->add_item($si);
            }
        }

        // Apply coupon code if provided
        if (!empty($p['coupon_code'])) {
            $coupon_code = sanitize_text_field($p['coupon_code']);
            $result = $o->apply_coupon($coupon_code);
            if (is_wp_error($result)) {
                // Add as a note rather than failing the whole save
                $o->add_order_note('Coupon "' . $coupon_code . '" could not be applied: ' . $result->get_error_message());
            } else {
                $o->calculate_totals(false);
            }
        }

        if (isset($p['note']) && $p['note'] !== '')
            $o->add_order_note(sanitize_textarea_field($p['note']), 0);

        // ── UPDATE LINE ITEMS ─────────────────────────────────────
        // If items array provided, replace all existing product line items
        if (isset($p['items']) && is_array($p['items'])) {
            // Remove existing product line items
            foreach ($o->get_items() as $item_id => $item) {
                $o->remove_item($item_id);
            }

            $VAT_DIV = 1.15;
            $TAX_KEY = 1;
            $order_ex_sum = 0.0;
            $order_tax    = 0.0;

            foreach ($p['items'] as $item) {
                $qty        = max(1, intval($item['qty'] ?? 1));
                $price_incl = floatval($item['price'] ?? 0);
                $product_id = intval($item['product_id'] ?? $item['id'] ?? 0);
                $var_id     = intval($item['variation_id'] ?? 0);
                $incl       = round($price_incl * $qty, 6);
                $ex         = round($incl / $VAT_DIV, 6);
                $tax        = round($incl - $ex, 6);

                $product = $product_id ? wc_get_product($var_id ?: $product_id) : null;
                $li = new WC_Order_Item_Product();

                if ($product) {
                    $li->set_product($product);
                    if ($var_id) $li->set_variation_id($var_id);
                } else {
                    $li->set_name(sanitize_text_field($item['name'] ?? 'Item'));
                    $li->set_product_id(0);
                }

                $li->set_quantity($qty);
                $li->set_subtotal($ex);
                $li->set_total($ex);
                $li->set_taxes(['subtotal' => [$TAX_KEY => $tax], 'total' => [$TAX_KEY => $tax]]);
                $o->add_item($li);

                $order_ex_sum += $ex;
                $order_tax    += $tax;
            }

            // Recalculate order total from the edited lines, VAT and delivery.
            $o->calculate_totals(false);
            $ship_total = $edited_ship_total !== null ? $edited_ship_total : (float)$o->get_shipping_total();
            $grand_total = round($order_ex_sum + $order_tax + $ship_total, 2);
            $o->set_total($grand_total);
            $o->set_cart_tax(round($order_tax, 2));
            $o->set_shipping_total(round($ship_total, 2));
        }

        $o->save();
        remove_filter('woocommerce_can_reduce_order_stock', '__return_false', 99);
        return new WP_REST_Response([
            'success'        => true,
            'status'         => $o->get_status(),
            'payment_method' => $o->get_payment_method(),
            'payment_title'  => $o->get_payment_method_title(),
            'total'          => $o->get_total(),
        ]);
    }

    // ── INVENTORY ─────────────────────────────────────────────────
    public static function inventory() {
        $products = wc_get_products(['status'=>'publish','limit'=>500]);
        $data = [];
        foreach ($products as $p) {
            $cost = (float)(get_post_meta($p->get_id(),'_wc_cog_cost',true)?:0);
            // Get category names for this product
            $cats = [];
            foreach ($p->get_category_ids() as $cid) {
                $term = get_term($cid,'product_cat');
                if ($term && !is_wp_error($term)) $cats[] = $term->name;
            }
            $cat_str = implode(', ', $cats);
            if ($p->get_type()==='variable') {
                foreach ($p->get_children() as $vid) {
                    $v = wc_get_product($vid);
                    if (!$v) continue;
                    $vc = (float)(get_post_meta($vid,'_wc_cog_cost',true)?:$cost);
                    $qty = (int)$v->get_stock_quantity();
                    $attrs = [];
                    foreach ($v->get_variation_attributes() as $k=>$val) {
                        $tax = str_replace('attribute_','',$k);
                        $term = get_term_by('slug',$val,$tax);
                        $attrs[] = $term?$term->name:$val;
                    }
                    $data[] = ['id'=>$vid,'parent_id'=>$p->get_id(),'name'=>$p->get_name(),'attributes'=>implode(' / ',$attrs),'sku'=>$v->get_sku(),'price'=>(float)$v->get_price(),'cost'=>$vc,'stock_qty'=>$qty,'manage_stock'=>$v->get_manage_stock(),'stock_value'=>$vc*$qty,'retail_value'=>(float)$v->get_price()*$qty,'type'=>'variation','categories'=>$cat_str];
                }
            } else {
                $qty = (int)$p->get_stock_quantity();
                $data[] = ['id'=>$p->get_id(),'parent_id'=>0,'name'=>$p->get_name(),'attributes'=>'','sku'=>$p->get_sku(),'price'=>(float)$p->get_price(),'cost'=>$cost,'stock_qty'=>$qty,'manage_stock'=>$p->get_manage_stock(),'stock_value'=>$cost*$qty,'retail_value'=>(float)$p->get_price()*$qty,'type'=>'simple','categories'=>$cat_str];
            }
        }
        return new WP_REST_Response($data);
    }

    // ── UPDATE COST PRICE ─────────────────────────────────────────
    public static function update_cost($req) {
        $id   = intval($req->get_param('id'));
        $cost = floatval($req->get_json_params()['cost'] ?? 0);
        if (!$id) return new WP_REST_Response(['error'=>'Invalid ID'],400);
        update_post_meta($id, '_wc_cog_cost', $cost);
        // Recalculate stock_value with new cost
        $product = wc_get_product($id);
        if ($product) {
            $qty = (int)$product->get_stock_quantity();
            return new WP_REST_Response(['success'=>true,'cost'=>$cost,'stock_value'=>$cost*$qty]);
        }
        return new WP_REST_Response(['success'=>true,'cost'=>$cost]);
    }
    public static function update_stock($req) {
        global $wpdb;
        $product = wc_get_product(intval($req->get_param('id')));
        if (!$product) return new WP_REST_Response(['error'=>'Not found'],404);
        $old_qty = (int)$product->get_stock_quantity();
        $qty = intval($req->get_json_params()['qty'] ?? 0);
        $notes = sanitize_text_field($req->get_json_params()['notes'] ?? '');
        wc_update_product_stock($product,$qty,'set');
        // Log the change
        $wpdb->insert("{$wpdb->prefix}hpos_inventory_log", [
            'product_id'   => $product->get_id(),
            'product_name' => $product->get_name(),
            'old_qty'      => $old_qty,
            'new_qty'      => $qty,
            'change_type'  => 'manual',
            'cashier_id'   => get_current_user_id(),
            'cashier_name' => wp_get_current_user()->display_name,
            'notes'        => $notes,
            'created_at'   => current_time('mysql'),
        ]);
        return new WP_REST_Response(['success'=>true,'stock_qty'=>$qty,'log_id'=>$wpdb->insert_id]);
    }
    public static function inventory_log($req) {
        global $wpdb;
        $limit = intval($req->get_param('limit') ?: 200);
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hpos_inventory_log ORDER BY created_at DESC LIMIT %d", $limit
        ), ARRAY_A);
        return new WP_REST_Response($rows ?: []);
    }

    // ── REPORTS ───────────────────────────────────────────────────
    public static function reports($req) {
        $period = sanitize_text_field($req->get_param('period') ?: 'today');
        $from_c = sanitize_text_field($req->get_param('from') ?: '');
        $to_c   = sanitize_text_field($req->get_param('to') ?: '');

        if ($from_c && $to_c) {
            $from = $from_c . ' 00:00:00';
            $to   = $to_c   . ' 23:59:59';
        } else {
            switch ($period) {
                case 'week':  $from = date('Y-m-d 00:00:00', strtotime('monday this week')); $to = date('Y-m-d 23:59:59'); break;
                case 'month': $from = date('Y-m-01 00:00:00'); $to = date('Y-m-d 23:59:59'); break;
                case 'year':  $from = date('Y-01-01 00:00:00'); $to = date('Y-m-d 23:59:59'); break;
                default:      $from = date('Y-m-d 00:00:00'); $to = date('Y-m-d 23:59:59'); break;
            }
        }

        // Primary: wc_get_orders with date_created params (works with HPOS and legacy)
        $ids = [];
        if (function_exists('wc_get_orders')) {
            $ids = wc_get_orders([
                'limit'        => -1,
                'status'       => ['completed', 'processing', 'on-hold'],
                'return'       => 'ids',
                'date_created' => '>=' . strtotime($from),
            ]);
            // Further filter by end date (wc_get_orders only supports >= for date_created)
            $to_ts = strtotime($to);
            $ids = array_filter((array)$ids, function($id) use ($to_ts) {
                $o = wc_get_order($id);
                return $o && $o->get_date_created() && $o->get_date_created()->getTimestamp() <= $to_ts;
            });
            $ids = array_values($ids);
        }

        // Fallback: WP_Query for non-HPOS stores
        if (empty($ids)) {
            $args = [
                'post_type'      => 'shop_order',
                'post_status'    => ['wc-completed', 'wc-processing', 'wc-on-hold'],
                'posts_per_page' => -1,
                'date_query'     => [['after' => $from, 'before' => $to, 'inclusive' => true]],
                'fields'         => 'ids',
            ];
            $ids = get_posts($args);
        }

        $sales=0; $tax=0; $disc=0; $shipping_total=0; $shipping_orders=0;
        $by_method=[]; $by_cashier=[]; $by_status=[]; $daily=[];

        foreach ($ids as $id) {
            $o = wc_get_order($id);
            if (!$o) continue;
            $total = (float)$o->get_total();
            $sales += $total;
            // Always derive VAT using inclusive formula: total * 15/115
            $order_vat = round($total * 15 / 115, 4);
            $tax   += $order_vat;
            $disc  += (float)$o->get_discount_total();

            $ship = (float)$o->get_shipping_total();
            if ($ship > 0) { $shipping_total += $ship; $shipping_orders++; }

            $pm = $o->get_payment_method_title() ?: ($o->get_payment_method() ?: 'Unknown');
            if (!isset($by_method[$pm])) $by_method[$pm] = ['count'=>0,'total'=>0];
            $by_method[$pm]['count']++; $by_method[$pm]['total'] += $total;

            $ca = $o->get_meta('_hpos_cashier_name') ?: 'Online';
            if (!isset($by_cashier[$ca])) $by_cashier[$ca] = ['count'=>0,'total'=>0];
            $by_cashier[$ca]['count']++; $by_cashier[$ca]['total'] += $total;

            $st = $o->get_status();
            if (!isset($by_status[$st])) $by_status[$st] = ['count'=>0,'total'=>0];
            $by_status[$st]['count']++; $by_status[$st]['total'] += $total;

            $day = $o->get_date_created() ? $o->get_date_created()->format('Y-m-d') : '';
            if ($day) {
                if (!isset($daily[$day])) $daily[$day] = ['count'=>0,'total'=>0,'tax'=>0,'shipping'=>0];
                $daily[$day]['count']++;
                $daily[$day]['total']    += $total;
                $daily[$day]['tax']      += round($total * 15 / 115, 4);
                $daily[$day]['shipping'] += $ship;
            }
        }

        $bm=[]; foreach($by_method  as $k=>$v) $bm[] = array_merge(['method' =>$k],$v);
        $bc=[]; foreach($by_cashier as $k=>$v) $bc[] = array_merge(['cashier'=>$k],$v);
        $bs=[]; foreach($by_status  as $k=>$v) $bs[] = array_merge(['status' =>$k],$v);
        $dl=[]; foreach($daily      as $k=>$v) $dl[] = array_merge(['date'   =>$k],$v);
        usort($dl, function($a,$b){ return strcmp($a['date'],$b['date']); });

        // Top products
        $product_sales = [];
        foreach ($ids as $id) {
            $o = wc_get_order($id); if (!$o) continue;
            foreach ($o->get_items() as $item) {
                $pid = $item->get_product_id();
                if (!isset($product_sales[$pid])) $product_sales[$pid] = ['name'=>$item->get_name(),'qty'=>0,'total'=>0];
                $product_sales[$pid]['qty']   += (int)$item->get_quantity();
                $product_sales[$pid]['total'] += (float)$item->get_total();
            }
        }
        uasort($product_sales, function($a,$b){ return $b['total'] <=> $a['total']; });
        $top_products = array_values(array_slice($product_sales, 0, 10));
        // Add VAT portion to each product
        foreach ($top_products as &$prod) {
            $prod['vat'] = round($prod['total'] * 15 / 115, 4);
        }
        unset($prod);

        // Refunds in period — with VAT portion
        $refund_total = 0; $refund_vat = 0;
        $refund_rows  = [];
        $ref_args = [
            'post_type'      => 'shop_order_refund',
            'posts_per_page' => -1,
            'date_query'     => [['after'=>$from,'before'=>$to,'inclusive'=>true]],
            'fields'         => 'ids',
        ];
        foreach (get_posts($ref_args) as $rid) {
            $r = wc_get_order($rid);
            if (!$r) continue;
            $amt = abs((float)$r->get_total());
            $vat = round($amt * 15 / 115, 4);
            $refund_total += $amt;
            $refund_vat   += $vat;
            $parent = $r->get_parent_id();
            $refund_rows[] = [
                'date'         => $r->get_date_created() ? $r->get_date_created()->format('Y-m-d') : '',
                'order_ref'    => $parent ? '#'.$parent : '—',
                'amount'       => $amt,
                'vat'          => $vat,
                'reason'       => $r->get_reason() ?: '—',
            ];
        }

        return new WP_REST_Response([
            'period'          => $period,
            'from'            => $from,
            'to'              => $to,
            'totals'          => ['count'=>count($ids),'sales'=>$sales,'tax'=>$tax,'discount'=>$disc,'refunds'=>$refund_total,'refund_vat'=>$refund_vat],
            'by_method'       => $bm,
            'by_cashier'      => $bc,
            'by_status'       => $bs,
            'daily'           => $dl,
            'top_products'    => $top_products,
            'refund_rows'     => $refund_rows,
            'shipping_total'  => $shipping_total,
            'shipping_orders' => $shipping_orders,
        ]);
    }

    // ── SETTINGS ─────────────────────────────────────────────────
    public static function get_settings() {
        return new WP_REST_Response(['store_name'=>get_option('hpos_store_name'),'location'=>get_option('hpos_location'),'currency'=>get_option('hpos_currency','N$'),'vat_number'=>get_option('hpos_vat_number',''),'store_address'=>get_option('hpos_store_address',''),'store_phone'=>get_option('hpos_store_phone',''),'store_email'=>get_option('hpos_store_email',get_option('admin_email')),'receipt_footer'=>get_option('hpos_receipt_footer','Thank you!'),'logo_url'=>get_option('hpos_logo_url',''),'staff_pin'=>get_option('hpos_staff_pin',''),'reports_pin'=>get_option('hpos_reports_pin',''),'budget_pin'=>get_option('hpos_budget_pin','')]);
    }
    public static function save_settings($req) {
        $p = $req->get_json_params();
        foreach (['store_name','location','currency','vat_number','store_address','store_phone','store_email','receipt_footer','logo_url','staff_pin','reports_pin','budget_pin'] as $f)
            if (isset($p[$f])) update_option('hpos_'.$f, sanitize_text_field($p[$f]));
        return new WP_REST_Response(['success'=>true]);
    }

    // ── BUDGET DATA ────────────────────────────────────────────────
    public static function get_budget() {
        $data = get_option('hpos_budget_data', '{}');
        $parsed = json_decode($data, true);
        if (!is_array($parsed)) $parsed = [];
        return new WP_REST_Response($parsed);
    }
    public static function save_budget($req) {
        $p = $req->get_json_params();
        // Never save PIN here — PIN is in settings
        unset($p['pin']);
        update_option('hpos_budget_data', json_encode($p), false);
        return new WP_REST_Response(['success' => true]);
    }

    // ── BUDGET MONTHLY SALES (financial year Mar–Feb) ─────────────
    public static function budget_sales($req) {
        $fy_start = intval($req->get_param('fy') ?: date('Y'));
        // Financial year: March $fy_start → February ($fy_start+1)
        $months = [];
        for ($m = 3; $m <= 12; $m++) {
            $months[] = sprintf('%04d-%02d', $fy_start, $m);
        }
        for ($m = 1; $m <= 2; $m++) {
            $months[] = sprintf('%04d-%02d', $fy_start + 1, $m);
        }

        $result = [];
        foreach ($months as $ym) {
            list($y, $mo) = explode('-', $ym);
            $from = $ym . '-01 00:00:00';
            $to   = $ym . '-' . date('t', mktime(0,0,0,(int)$mo,1,(int)$y)) . ' 23:59:59';
            $ids  = wc_get_orders([
                'status'       => ['completed','processing','on-hold'],
                'date_created' => $from.'...'.$to,
                'limit'        => -1,
                'return'       => 'ids',
            ]);
            $total = 0;
            $daily = [];
            foreach ((array)$ids as $id) {
                $o = wc_get_order($id);
                if (!$o) continue;
                $amt   = (float)$o->get_total() - (float)$o->get_total_tax() - (float)$o->get_shipping_total();
                $total += $amt;
                $day   = $o->get_date_created() ? $o->get_date_created()->format('Y-m-d') : '';
                if ($day) {
                    if (!isset($daily[$day])) $daily[$day] = 0;
                    $daily[$day] += $amt;
                }
            }
            $result[] = [
                'month'  => $ym,
                'total'  => round($total, 2),
                'orders' => count((array)$ids),
                'daily'  => $daily,
            ];
        }
        return new WP_REST_Response(['fy' => $fy_start, 'months' => $result]);
    }
    public static function coupon($req) {
        $code = sanitize_text_field($req->get_param('code') ?: '');
        if (!$code) return new WP_REST_Response(['error'=>'Coupon code required'], 400);
        $coupon_id = wc_get_coupon_id_by_code($code);
        if (!$coupon_id) return new WP_REST_Response(['error'=>'Coupon not found: '.$code], 404);
        $coupon = new WC_Coupon($coupon_id);
        if ($coupon->is_expired()) return new WP_REST_Response(['error'=>'Coupon has expired'], 400);
        $usage_limit = $coupon->get_usage_limit();
        if ($usage_limit > 0 && $coupon->get_usage_count() >= $usage_limit)
            return new WP_REST_Response(['error'=>'Coupon usage limit reached'], 400);
        return new WP_REST_Response([
            'code'        => $coupon->get_code(),
            'type'        => $coupon->get_discount_type(), // percent, fixed_cart, fixed_product
            'amount'      => (float)$coupon->get_amount(),
            'description' => $coupon->get_description(),
            'min_amount'  => (float)$coupon->get_minimum_amount(),
            'max_amount'  => (float)$coupon->get_maximum_amount(),
            'free_shipping' => $coupon->get_free_shipping(),
        ]);
    }

    // ── REFUND ────────────────────────────────────────────────────
    public static function create_refund($req) {
        global $wpdb;
        $p       = $req->get_json_params();
        $order_id = intval($p['order_id'] ?? 0);
        $reason   = sanitize_text_field($p['reason'] ?? '');
        $restock  = !empty($p['restock']);
        $items    = $p['items'] ?? [];

        $order = wc_get_order($order_id);
        if (!$order) return new WP_REST_Response(['error'=>'Order not found'], 404);

        // Build line items for refund
        $refund_items = [];
        $refund_total = 0;
        foreach ($items as $item) {
            $qty   = intval($item['qty'] ?? 0);
            $price = floatval($item['price'] ?? 0);
            $refund_total += $qty * $price;
            // Find matching order item
            foreach ($order->get_items() as $item_id => $order_item) {
                if ($order_item->get_product_id() == intval($item['id'] ?? 0) ||
                    $order_item->get_variation_id() == intval($item['id'] ?? 0) ||
                    $order_item->get_name() === ($item['name'] ?? '')) {
                    $refund_items[$item_id] = ['qty' => $qty, 'refund_total' => $qty * $price];
                    break;
                }
            }
        }

        // Create WC refund
        $refund = wc_create_refund([
            'order_id'   => $order_id,
            'amount'     => $refund_total,
            'reason'     => $reason,
            'line_items' => $refund_items,
            'restock_items' => $restock,
        ]);
        if (is_wp_error($refund)) return new WP_REST_Response(['error'=>$refund->get_error_message()], 400);

        // Log to activity log
        $wpdb->insert("{$wpdb->prefix}hpos_activity_log", [
            'user_id'    => get_current_user_id(),
            'action'     => 'refund',
            'object_id'  => $order_id,
            'details'    => json_encode(['refund_id'=>$refund->get_id(),'amount'=>$refund_total,'reason'=>$reason]),
            'created_at' => current_time('mysql'),
        ]);

        // Log refund to custom table too
        $wpdb->insert("{$wpdb->prefix}hpos_refunds", [
            'order_id'     => $order_id,
            'wc_refund_id' => $refund->get_id(),
            'cashier_id'   => get_current_user_id(),
            'cashier_name' => wp_get_current_user()->display_name,
            'amount'       => $refund_total,
            'reason'       => $reason,
            'restocked'    => $restock ? 1 : 0,
            'created_at'   => current_time('mysql'),
        ]);

        // Add order note
        $order->add_order_note(sprintf('POS Refund: %s%s. Reason: %s. Cashier: %s',
            get_option('hpos_currency','N$'), number_format($refund_total,2),
            $reason ?: 'Not specified',
            wp_get_current_user()->display_name
        ));

        return new WP_REST_Response([
            'success'    => true,
            'refund_id'  => $refund->get_id(),
            'amount'     => $refund_total,
            'order_status' => $order->get_status(),
        ]);
    }

    // ── REFUND LIST ───────────────────────────────────────────────
    public static function refund_list($req) {
        global $wpdb;
        $limit = intval($req->get_param('limit') ?: 200);
        $from  = sanitize_text_field($req->get_param('from') ?: '');
        $to    = sanitize_text_field($req->get_param('to') ?: '');
        $where = '1=1';
        if ($from) $where .= $wpdb->prepare(" AND created_at >= %s", $from.' 00:00:00');
        if ($to)   $where .= $wpdb->prepare(" AND created_at <= %s", $to.' 23:59:59');
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hpos_refunds WHERE $where ORDER BY created_at DESC LIMIT %d", $limit
        ), ARRAY_A);
        $total = (float)$wpdb->get_var("SELECT SUM(amount) FROM {$wpdb->prefix}hpos_refunds WHERE $where");
        return new WP_REST_Response(['refunds'=>$rows ?: [], 'total'=>$total]);
    }

    // ── DAILY SUMMARY ─────────────────────────────────────────────
    public static function daily_summary($req) {
        $date = sanitize_text_field($req->get_param('date') ?: date('Y-m-d'));
        $from = $date . ' 00:00:00';
        $to   = $date . ' 23:59:59';
        $from_ts = strtotime($from);
        $to_ts   = strtotime($to);

        // Primary: wc_get_orders with date filter (HPOS compatible)
        $ids = [];
        if (function_exists('wc_get_orders')) {
            $ids = wc_get_orders([
                'limit'        => -1,
                'status'       => ['completed', 'processing', 'on-hold'],
                'return'       => 'ids',
                'date_created' => '>=' . $from_ts,
            ]);
            $ids = array_values(array_filter((array)$ids, function($id) use ($to_ts) {
                $o = wc_get_order($id);
                return $o && $o->get_date_created() && $o->get_date_created()->getTimestamp() <= $to_ts;
            }));
        }

        // Fallback: WP_Query for non-HPOS stores
        if (empty($ids)) {
            $args = [
                'post_type'      => 'shop_order',
                'post_status'    => ['wc-completed', 'wc-processing', 'wc-on-hold'],
                'posts_per_page' => -1,
                'date_query'     => [['after' => $from, 'before' => $to, 'inclusive' => true]],
                'fields'         => 'ids',
            ];
            $ids = get_posts($args);
        }

        $total=0; $cash=0; $card=0; $eft=0; $other=0;
        $refunds_total=0; $product_sales=[];

        foreach ($ids as $id) {
            $o = wc_get_order($id); if (!$o) continue;
            $amt = (float)$o->get_total();
            $total += $amt;
            $pm = strtolower($o->get_payment_method() ?: '');
            if ($pm === 'cash') $cash += $amt;
            elseif (in_array($pm, ['swipe','card','stripe'])) $card += $amt;
            elseif ($pm === 'eft') $eft += $amt;
            else $other += $amt;

            foreach ($o->get_items() as $item) {
                $pid = $item->get_product_id();
                if (!isset($product_sales[$pid])) $product_sales[$pid] = ['name'=>$item->get_name(),'qty'=>0,'total'=>0];
                $product_sales[$pid]['qty'] += (int)$item->get_quantity();
                $product_sales[$pid]['total'] += (float)$item->get_total();
            }
        }

        // Refunds for the day — use WP_Query directly (refunds are always posts)
        $ref_ids = get_posts([
            'post_type'      => 'shop_order_refund',
            'post_status'    => 'any',
            'posts_per_page' => -1,
            'date_query'     => [['after' => $from, 'before' => $to, 'inclusive' => true]],
            'fields'         => 'ids',
        ]);
        foreach ($ref_ids as $rid) {
            $r = wc_get_order($rid); if ($r) $refunds_total += abs((float)$r->get_total());
        }

        // Top products
        uasort($product_sales, function($a,$b){ return $b['total'] <=> $a['total']; });
        $top = array_values(array_slice($product_sales, 0, 10));

        return new WP_REST_Response([
            'date'     => $date,
            'orders'   => count($ids),
            'revenue'  => $total,
            'cash'     => $cash,
            'card'     => $card,
            'eft'      => $eft,
            'other'    => $other,
            'refunds'  => $refunds_total,
            'top_products' => $top,
        ]);
    }

    // ── ACTIVITY LOG ──────────────────────────────────────────────
    public static function activity_log($req) {
        global $wpdb;
        $limit = intval($req->get_param('limit') ?: 100);
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hpos_activity_log ORDER BY created_at DESC LIMIT %d", $limit
        ), ARRAY_A);
        return new WP_REST_Response($rows ?: []);
    }
    public static function log_activity($req) {
        global $wpdb;
        $p = $req->get_json_params();
        $wpdb->insert("{$wpdb->prefix}hpos_activity_log", [
            'user_id'    => get_current_user_id(),
            'action'     => sanitize_text_field($p['action'] ?? 'unknown'),
            'object_id'  => intval($p['object_id'] ?? 0),
            'details'    => wp_json_encode($p['details'] ?? []),
            'created_at' => current_time('mysql'),
        ]);
        return new WP_REST_Response(['success'=>true,'id'=>$wpdb->insert_id]);
    }

    /**
     * price_check — calculate WooCommerce prices for a set of cart items.
     *
     * Uses the real WC()->cart instance (with session) so that ALL third-party
     * pricing plugins (Seraphinite Bulk Discounts, Dynamic Pricing, etc.) fire
     * their hooks correctly. We save the real cart, swap in temp items, calculate,
     * read prices, then restore the real cart.
     *
     * POST body: { items: [ { id, qty, variation_id? }, ... ] }
     * Returns:   { prices: { "<product_id>-<variation_id|0>": unit_price_incl_vat } }
     */
    public static function price_check($req) {
        $p     = $req->get_json_params();
        $items = $p['items'] ?? [];
        if (empty($items)) return new WP_REST_Response(['prices' => []]);

        // Ensure WooCommerce is fully initialised with a session
        if (!function_exists('WC') || !WC()->cart) {
            // Try to initialise WC frontend components if not already done
            if (function_exists('wc_load_cart')) {
                wc_load_cart();
            }
        }

        if (!WC()->cart) {
            return new WP_REST_Response(['error' => 'WooCommerce cart not available'], 500);
        }

        $real_cart = WC()->cart;

        // 1. Snapshot the real cart contents so we can restore them
        $saved_cart    = $real_cart->get_cart_for_session();
        $saved_totals  = $real_cart->get_totals();
        $saved_removed = $real_cart->removed_cart_contents;
        $saved_coupon  = $real_cart->get_applied_coupons();

        // 2. Empty the real cart (preserves session / customer / tax context)
        $real_cart->empty_cart(false); // false = don't clear persistent session

        // 3. Add the requested items
        foreach ($items as $item) {
            $product_id   = intval($item['id'] ?? 0);
            $variation_id = intval($item['variation_id'] ?? 0);
            $qty          = max(1, intval($item['qty'] ?? 1));
            if (!$product_id) continue;

            $variation_data = [];
            if ($variation_id) {
                $var_product = wc_get_product($variation_id);
                if ($var_product && $var_product->is_type('variation')) {
                    $variation_data = $var_product->get_variation_attributes();
                }
            }

            $real_cart->add_to_cart($product_id, $qty, $variation_id, $variation_data);
        }

        // 4. Run WC full calculation — fires ALL hooks including Seraphinite
        $real_cart->calculate_totals();

        // 5. Read back per-item discounted unit prices
        $prices = [];
        foreach ($real_cart->get_cart() as $cart_item) {
            $pid  = intval($cart_item['product_id']);
            $vid  = intval($cart_item['variation_id'] ?? 0);
            $qty  = floatval($cart_item['quantity']);
            $key  = $pid . '-' . $vid;

            // line_total is ex-VAT; line_tax is the VAT portion
            $line_excl = floatval($cart_item['line_total']);
            $line_tax  = floatval($cart_item['line_tax']);
            $line_incl = $line_excl + $line_tax;

            // Per-unit price inclusive of VAT
            $unit_price   = $qty > 0 ? round($line_incl / $qty, 4) : 0;
            $prices[$key] = $unit_price;

            // Also expose the discount amount so JS can show a strikethrough
            $subtotal_excl = floatval($cart_item['line_subtotal']);
            $subtotal_tax  = floatval($cart_item['line_subtotal_tax']);
            $subtotal_incl = $subtotal_excl + $subtotal_tax;
            $regular_unit  = $qty > 0 ? round($subtotal_incl / $qty, 4) : $unit_price;
            if (abs($regular_unit - $unit_price) > 0.005) {
                $prices[$key . '_regular'] = $regular_unit; // regular (non-discounted) unit price
            }
        }

        // 6. Restore the real cart
        $real_cart->empty_cart(false);
        foreach ($saved_cart as $cart_key => $cart_item_data) {
            $product_id   = intval($cart_item_data['product_id'] ?? 0);
            $qty          = intval($cart_item_data['quantity'] ?? 1);
            $variation_id = intval($cart_item_data['variation_id'] ?? 0);
            $variation    = $cart_item_data['variation'] ?? [];
            if ($product_id) {
                $real_cart->add_to_cart($product_id, $qty, $variation_id, $variation);
            }
        }
        // Restore removed items reference
        $real_cart->removed_cart_contents = $saved_removed;
        // Re-apply coupons silently
        foreach ($saved_coupon as $coupon_code) {
            $real_cart->apply_coupon($coupon_code);
        }
        // Recalculate restored cart
        if (!empty($saved_cart)) {
            $real_cart->calculate_totals();
        }

        return new WP_REST_Response(['prices' => $prices]);
    }

    // ═══════════════════════════════════════════════════════════════
    // QUOTES
    // ═══════════════════════════════════════════════════════════════

    private static function next_quote_number() {
        global $wpdb;
        $table = $wpdb->prefix . 'hpos_quotes';
        $last  = $wpdb->get_var("SELECT quote_number FROM $table ORDER BY id DESC LIMIT 1");
        if ($last && preg_match('/QT-(\d+)/', $last, $m)) {
            return 'QT-' . str_pad((int)$m[1] + 1, 4, '0', STR_PAD_LEFT);
        }
        return 'QT-' . str_pad((int)$wpdb->get_var("SELECT COUNT(*) FROM $table") + 1001, 4, '0', STR_PAD_LEFT);
    }

    private static function fmt_quote($row) {
        return [
            'id'               => (int)$row->id,
            'quote_number'     => $row->quote_number,
            'status'           => $row->status,
            'customer_id'      => (int)$row->customer_id,
            'customer_name'    => $row->customer_name,
            'customer_email'   => $row->customer_email,
            'customer_phone'   => $row->customer_phone,
            'customer_address' => $row->customer_address,
            'items'            => json_decode($row->items ?: '[]', true),
            'subtotal'         => (float)$row->subtotal,
            'discount'         => (float)$row->discount,
            'shipping'         => (float)$row->shipping,
            'total'            => (float)$row->total,
            'notes'            => $row->notes,
            'valid_days'       => (int)$row->valid_days,
            'cashier_id'       => (int)$row->cashier_id,
            'cashier_name'     => $row->cashier_name,
            'order_id'         => (int)$row->order_id,
            'created_at'       => $row->created_at,
            'updated_at'       => $row->updated_at,
            'expires_at'       => date('Y-m-d', strtotime($row->created_at) + ((int)$row->valid_days * 86400)),
        ];
    }

    public static function get_quotes($req) {
        global $wpdb;
        $table  = $wpdb->prefix . 'hpos_quotes';
        $status = sanitize_text_field($req->get_param('status') ?: '');
        $q      = sanitize_text_field($req->get_param('q') ?: '');
        $sql    = "SELECT * FROM $table WHERE 1=1";
        $args   = [];
        if ($status) { $sql .= " AND status = %s"; $args[] = $status; }
        if ($q)      { $sql .= " AND (quote_number LIKE %s OR customer_name LIKE %s OR customer_email LIKE %s)"; $args[] = "%$q%"; $args[] = "%$q%"; $args[] = "%$q%"; }
        $sql .= " ORDER BY id DESC LIMIT 200";
        $rows = $args ? $wpdb->get_results($wpdb->prepare($sql, ...$args)) : $wpdb->get_results($sql);
        return new WP_REST_Response(array_map([__CLASS__, 'fmt_quote'], $rows ?: []));
    }

    public static function create_quote($req) {
        global $wpdb;
        $p      = $req->get_json_params();
        $table  = $wpdb->prefix . 'hpos_quotes';
        $user   = wp_get_current_user();
        $data   = [
            'quote_number'     => self::next_quote_number(),
            'status'           => 'draft',
            'customer_id'      => intval($p['customer_id'] ?? 0),
            'customer_name'    => sanitize_text_field($p['customer_name'] ?? ''),
            'customer_email'   => sanitize_email($p['customer_email'] ?? ''),
            'customer_phone'   => sanitize_text_field($p['customer_phone'] ?? ''),
            'customer_address' => sanitize_textarea_field($p['customer_address'] ?? ''),
            'items'            => json_encode($p['items'] ?? []),
            'subtotal'         => floatval($p['subtotal'] ?? 0),
            'discount'         => floatval($p['discount'] ?? 0),
            'shipping'         => floatval($p['shipping'] ?? 0),
            'total'            => floatval($p['total'] ?? 0),
            'notes'            => sanitize_textarea_field($p['notes'] ?? ''),
            'valid_days'       => intval($p['valid_days'] ?? 30),
            'cashier_id'       => $user->ID,
            'cashier_name'     => $user->display_name,
        ];
        $wpdb->insert($table, $data);
        if (!$wpdb->insert_id) return new WP_REST_Response(['error' => 'Insert failed'], 500);
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $wpdb->insert_id));
        return new WP_REST_Response(self::fmt_quote($row), 201);
    }

    public static function update_quote($req) {
        global $wpdb;
        $id    = intval($req->get_param('id'));
        $p     = $req->get_json_params();
        $table = $wpdb->prefix . 'hpos_quotes';
        $row   = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id));
        if (!$row) return new WP_REST_Response(['error' => 'Not found'], 404);
        // Cannot edit a quote that has been converted
        if ($row->order_id > 0 && empty($p['status'])) return new WP_REST_Response(['error' => 'Quote already converted to order'], 400);

        $data = [];
        $allowed = ['status','customer_name','customer_email','customer_phone','valid_days'];
        foreach ($allowed as $f) {
            if (isset($p[$f])) $data[$f] = is_int($p[$f]) ? intval($p[$f]) : sanitize_text_field($p[$f]);
        }
        if (isset($p['customer_address'])) $data['customer_address'] = sanitize_textarea_field($p['customer_address']);
        if (isset($p['customer_id']))      $data['customer_id']      = intval($p['customer_id']);
        if (isset($p['items']))    $data['items']    = json_encode($p['items']);
        if (isset($p['subtotal'])) $data['subtotal'] = floatval($p['subtotal']);
        if (isset($p['discount'])) $data['discount'] = floatval($p['discount']);
        if (isset($p['shipping'])) $data['shipping'] = floatval($p['shipping']);
        if (isset($p['total']))    $data['total']    = floatval($p['total']);
        if (isset($p['notes']))    $data['notes']    = sanitize_textarea_field($p['notes']);
        $data['updated_at'] = current_time('mysql');

        if ($data) $wpdb->update($table, $data, ['id' => $id]);
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id));
        return new WP_REST_Response(self::fmt_quote($row));
    }

    public static function delete_quote($req) {
        global $wpdb;
        $id    = intval($req->get_param('id'));
        $table = $wpdb->prefix . 'hpos_quotes';
        $row   = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id));
        if (!$row) return new WP_REST_Response(['error' => 'Not found'], 404);
        if ($row->order_id > 0) return new WP_REST_Response(['error' => 'Cannot delete a converted quote'], 400);
        $wpdb->delete($table, ['id' => $id]);
        return new WP_REST_Response(['success' => true]);
    }

    public static function convert_quote($req) {
        global $wpdb;
        $id    = intval($req->get_param('id'));
        $table = $wpdb->prefix . 'hpos_quotes';
        $row   = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id));
        if (!$row) return new WP_REST_Response(['error' => 'Quote not found'], 404);
        if ($row->order_id > 0) return new WP_REST_Response(['error' => 'Already converted to order #' . $row->order_id], 400);

        $p     = $req->get_json_params();
        $items = json_decode($row->items ?: '[]', true);

        // Build a real WC order — identical flow to create_order but using quote data
        $order  = wc_create_order(['customer_id' => intval($row->customer_id)]);
        if (is_wp_error($order)) return new WP_REST_Response(['error' => $order->get_error_message()], 500);

        // Block WC auto stock reduction — we handle it below
        add_filter('woocommerce_can_reduce_order_stock', '__return_false', 99);

        $VAT_DIV = 1.15; $TAX_KEY = 1;
        $ex_sum = 0.0; $tax_sum = 0.0;

        foreach ($items as $item) {
            $product_id   = intval($item['id'] ?? $item['product_id'] ?? 0);
            $variation_id = intval($item['variation_id'] ?? 0);
            $qty          = max(1, intval($item['qty'] ?? 1));
            $incl         = round(floatval($item['price'] ?? 0) * $qty, 6);
            $ex           = round($incl / $VAT_DIV, 6);
            $tax          = round($incl - $ex, 6);

            $product = $product_id ? wc_get_product($variation_id ?: $product_id) : null;
            $li = new WC_Order_Item_Product();
            if ($product) {
                $li->set_product($product);
                if ($variation_id) $li->set_variation_id($variation_id);
                // Reduce stock if available
                $stock_prod = ($variation_id && $product->get_manage_stock()) ? $product : ($product_id ? wc_get_product($product_id) : null);
                if ($stock_prod && $stock_prod->get_manage_stock()) {
                    wc_update_product_stock($stock_prod, $qty, 'decrease');
                }
            } else {
                $li->set_name(sanitize_text_field($item['name'] ?? 'Item'));
                $li->set_product_id(0);
            }
            $li->set_quantity($qty);
            $li->set_subtotal($ex); $li->set_total($ex);
            $li->set_taxes(['subtotal' => [$TAX_KEY => $tax], 'total' => [$TAX_KEY => $tax]]);
            $order->add_item($li);
            $ex_sum += $ex; $tax_sum += $tax;
        }

        // Shipping
        if ($row->shipping > 0) {
            $ship_ex  = round($row->shipping / $VAT_DIV, 2);
            $ship_tax = round($row->shipping - $ship_ex, 2);
            $si = new WC_Order_Item_Shipping();
            $si->set_name(sanitize_text_field($p['shipping_title'] ?? 'Delivery'));
            $si->set_total($ship_ex); $si->set_taxes(['total' => [$TAX_KEY => $ship_tax]]);
            $order->add_item($si);
        }

        // Discount
        if ($row->discount > 0) {
            $fee = new WC_Order_Item_Fee();
            $fee->set_name('Discount'); $fee->set_total(-$row->discount / $VAT_DIV);
            $order->add_item($fee);
        }

        // Billing
        $billing = [
            'first_name' => '', 'last_name' => '', 'email' => $row->customer_email,
            'phone' => $row->customer_phone, 'address_1' => $row->customer_address,
            'country' => 'NA',
        ];
        $name_parts = explode(' ', $row->customer_name, 2);
        $billing['first_name'] = $name_parts[0] ?? ''; $billing['last_name'] = $name_parts[1] ?? '';
        $order->set_address($billing, 'billing');
        $order->set_address($billing, 'shipping');

        $pay_method = sanitize_text_field($p['payment_method'] ?? 'cash');
        $pay_title  = sanitize_text_field($p['payment_method_title'] ?? 'Cash');
        $order->set_payment_method($pay_method);
        $order->set_payment_method_title($pay_title);
        $order->set_created_via('pos-quote');
        $order->update_meta_data('_hpos_sale', true);
        $order->update_meta_data('_hpos_quote_id', $id);
        $order->update_meta_data('_hpos_quote_number', $row->quote_number);
        $order->update_meta_data('_wc_stock_reduced', 1);
        $order->set_status(sanitize_text_field($p['status'] ?? 'processing'));

        $grand_total = round($ex_sum + $tax_sum + (float)$row->shipping, 2);
        $order->set_total($grand_total);
        $order->calculate_totals(false);
        $order->save();

        remove_filter('woocommerce_can_reduce_order_stock', '__return_false', 99);

        // Mark quote as accepted + link order
        $wpdb->update($table, [
            'status'   => 'accepted',
            'order_id' => $order->get_id(),
        ], ['id' => $id]);

        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id));
        return new WP_REST_Response([
            'success'      => true,
            'quote'        => self::fmt_quote($row),
            'order_id'     => $order->get_id(),
            'order_number' => $order->get_order_number(),
            'total'        => $order->get_total(),
        ]);
    }
}
