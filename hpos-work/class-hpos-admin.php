<?php
if (!defined('ABSPATH')) exit;

class HPOS_Install {
    public static function init() {}

    public static function activate() {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $sql1 = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hpos_transactions (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            order_id bigint(20) unsigned NOT NULL,
            cashier_id bigint(20) unsigned NOT NULL DEFAULT 0,
            payment_method varchar(50) NOT NULL DEFAULT 'cash',
            amount decimal(10,2) NOT NULL DEFAULT 0,
            discount decimal(10,2) NOT NULL DEFAULT 0,
            tax decimal(10,2) NOT NULL DEFAULT 0,
            location varchar(100) NOT NULL DEFAULT '',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY order_id (order_id)
        ) $charset;";
        dbDelta($sql1);

        $sql2 = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hpos_activity_log (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL DEFAULT 0,
            action varchar(50) NOT NULL DEFAULT '',
            object_id bigint(20) unsigned NOT NULL DEFAULT 0,
            details longtext NOT NULL DEFAULT '',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY action (action),
            KEY user_id (user_id)
        ) $charset;";
        dbDelta($sql2);

        $sql3 = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hpos_cash_sessions (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            cashier_id bigint(20) unsigned NOT NULL DEFAULT 0,
            cashier_name varchar(100) NOT NULL DEFAULT '',
            opening decimal(10,2) NOT NULL DEFAULT 0,
            closing decimal(10,2) NOT NULL DEFAULT 0,
            expected decimal(10,2) NOT NULL DEFAULT 0,
            cash_sales decimal(10,2) NOT NULL DEFAULT 0,
            difference decimal(10,2) NOT NULL DEFAULT 0,
            notes text NOT NULL DEFAULT '',
            opened_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            closed_at datetime DEFAULT NULL,
            PRIMARY KEY (id)
        ) $charset;";
        dbDelta($sql3);

        $sql4 = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hpos_refunds (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            order_id bigint(20) unsigned NOT NULL,
            wc_refund_id bigint(20) unsigned NOT NULL DEFAULT 0,
            cashier_id bigint(20) unsigned NOT NULL DEFAULT 0,
            cashier_name varchar(100) NOT NULL DEFAULT '',
            amount decimal(10,2) NOT NULL DEFAULT 0,
            reason text NOT NULL DEFAULT '',
            restocked tinyint(1) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY order_id (order_id)
        ) $charset;";
        dbDelta($sql4);

        $sql5 = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hpos_inventory_log (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            product_id bigint(20) unsigned NOT NULL,
            product_name varchar(255) NOT NULL DEFAULT '',
            old_qty int(11) NOT NULL DEFAULT 0,
            new_qty int(11) NOT NULL DEFAULT 0,
            change_type varchar(50) NOT NULL DEFAULT 'manual',
            cashier_id bigint(20) unsigned NOT NULL DEFAULT 0,
            cashier_name varchar(100) NOT NULL DEFAULT '',
            notes text NOT NULL DEFAULT '',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY product_id (product_id),
            KEY created_at (created_at)
        ) $charset;";
        dbDelta($sql5);

        $sql6 = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hpos_ws_applications (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            business_name varchar(255) NOT NULL DEFAULT '',
            contact_person varchar(255) NOT NULL DEFAULT '',
            email varchar(255) NOT NULL DEFAULT '',
            phone varchar(100) NOT NULL DEFAULT '',
            city varchar(100) NOT NULL DEFAULT '',
            business_type varchar(100) NOT NULL DEFAULT '',
            status varchar(50) NOT NULL DEFAULT 'pending',
            user_id bigint(20) unsigned NOT NULL DEFAULT 0,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            approved_at datetime DEFAULT NULL,
            PRIMARY KEY (id),
            KEY status (status),
            KEY email (email)
        ) $charset;";
        dbDelta($sql6);

        $sql7 = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hpos_quotes (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            quote_number varchar(30) NOT NULL DEFAULT '',
            status varchar(30) NOT NULL DEFAULT 'draft',
            customer_id bigint(20) unsigned NOT NULL DEFAULT 0,
            customer_name varchar(255) NOT NULL DEFAULT '',
            customer_email varchar(255) NOT NULL DEFAULT '',
            customer_phone varchar(100) NOT NULL DEFAULT '',
            customer_address text,
            items longtext,
            subtotal decimal(10,2) NOT NULL DEFAULT 0,
            discount decimal(10,2) NOT NULL DEFAULT 0,
            shipping decimal(10,2) NOT NULL DEFAULT 0,
            total decimal(10,2) NOT NULL DEFAULT 0,
            notes text,
            valid_days int NOT NULL DEFAULT 30,
            cashier_id bigint(20) unsigned NOT NULL DEFAULT 0,
            cashier_name varchar(100) NOT NULL DEFAULT '',
            order_id bigint(20) unsigned NOT NULL DEFAULT 0,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY quote_number (quote_number),
            KEY status (status),
            KEY customer_id (customer_id)
        ) $charset;";
        dbDelta($sql7);

        // defaults
        $defaults = [
            'hpos_store_name'     => get_bloginfo('name'),
            'hpos_location'       => 'Windhoek Store',
            'hpos_currency'       => 'N$',
            'hpos_vat_number'     => '',
            'hpos_store_address'  => 'Office 1.3, Corner John Muundjua & Julius Nyerere St',
            'hpos_store_phone'    => '+264 856628598',
            'hpos_store_email'    => get_option('admin_email'),
            'hpos_receipt_footer' => 'Thank you for shopping with us!',
            'hpos_cat_website'    => 'www.hambelelaorganic.com',
            'hpos_cat_city'       => 'Lazarette House, Ausspannplatz, Windhoek, Namibia',
            'hpos_cat_tagline'    => 'Natural \u00B7 Organic \u00B7 Pure',
        ];
        foreach ($defaults as $k => $v) {
            if (!get_option($k)) update_option($k, $v);
        }
        update_option('hpos_db_version', '1.5');
    }
}
