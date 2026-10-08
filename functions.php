<?php
/**
 * Suntourz theme bootstrap.
 *
 * The theme only renders. Business logic lives in the suntourz-core plugin.
 *
 * @package Suntourz\Theme
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

define( 'STZ_THEME_VERSION', '0.1.0' );
define( 'STZ_THEME_DIR', get_template_directory() );
define( 'STZ_THEME_URI', get_template_directory_uri() );

require_once STZ_THEME_DIR . '/inc/setup.php';
require_once STZ_THEME_DIR . '/inc/plugin-check.php';
require_once STZ_THEME_DIR . '/inc/vite.php';
require_once STZ_THEME_DIR . '/inc/render.php';
require_once STZ_THEME_DIR . '/inc/fallback.php';
require_once STZ_THEME_DIR . '/inc/queries.php';
require_once STZ_THEME_DIR . '/inc/seo.php';
require_once STZ_THEME_DIR . '/inc/brand.php';
require_once STZ_THEME_DIR . '/inc/seo-fields.php';
