<?php
/**
 * Plugin Name: Hambelela POS
 * Description: Point of sale, order management, catalogue and wholesale portal tools for Hambelela Organic.
 * Version: 4.7.1
 * Author: Hambelela Organic
 * Text Domain: hambelela-pos
 */

if (!defined('ABSPATH')) exit;

if (!defined('HPOS_PLUGIN_FILE')) define('HPOS_PLUGIN_FILE', __FILE__);
if (!defined('HPOS_DIR')) define('HPOS_DIR', plugin_dir_path(__FILE__));
if (!defined('HPOS_URL')) define('HPOS_URL', plugin_dir_url(__FILE__));

require_once HPOS_DIR . 'includes/class-hpos-install.php';
require_once HPOS_DIR . 'includes/class-hpos-api.php';
require_once HPOS_DIR . 'includes/class-hpos-catalogue.php';
require_once HPOS_DIR . 'includes/class-hpos-wholesale.php';
require_once HPOS_DIR . 'includes/class-hpos-admin.php';

register_activation_hook(__FILE__, ['HPOS_Install', 'activate']);

add_action('plugins_loaded', function () {
    HPOS_Install::init();
    HPOS_API::init();
    HPOS_Catalogue::init();
    HPOS_Wholesale::init();
    HPOS_Admin::init();
});