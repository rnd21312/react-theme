<?php
/**
 * Theme supports and menu locations.
 *
 * @package Suntourz\Theme
 */

declare(strict_types=1);

namespace Suntourz\Theme;

defined( 'ABSPATH' ) || exit;

add_action(
	'after_setup_theme',
	static function (): void {
		load_theme_textdomain( 'suntourz', STZ_THEME_DIR . '/languages' );

		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'html5', array( 'script', 'style' ) );

		register_nav_menus(
			array(
				'primary' => __( 'Primary menu', 'suntourz' ),
				'footer'  => __( 'Footer menu', 'suntourz' ),
			)
		);
	}
);
