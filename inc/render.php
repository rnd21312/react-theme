<?php
/**
 * Template helpers: mount node, server-rendered fallback and the initial-data JSON.
 *
 * @package Suntourz\Theme
 */

declare(strict_types=1);

namespace Suntourz\Theme;

use Suntourz\Core\Container;
use Suntourz\Core\Plugin;

defined( 'ABSPATH' ) || exit;

/**
 * The core plugin's services, or null when the plugin is not active.
 */
function services(): ?Container {
	return core_active() && class_exists( Plugin::class ) ? Plugin::container() : null;
}

/**
 * Menu tree for a theme location, shaped for the React layout.
 *
 * @return array<int, array<string, mixed>>
 */
function menu_tree( string $location ): array {
	$locations = get_nav_menu_locations();
	if ( empty( $locations[ $location ] ) ) {
		return array();
	}

	$items = wp_get_nav_menu_items( (int) $locations[ $location ] );
	if ( ! is_array( $items ) ) {
		return array();
	}

	$nodes = array();
	foreach ( $items as $item ) {
		$nodes[ (int) $item->ID ] = array(
			'id'       => (int) $item->ID,
			'label'    => html_entity_decode( (string) $item->title, ENT_QUOTES, 'UTF-8' ), // Plain text for React (it escapes on output).
			'url'      => (string) $item->url,
			'current'  => (bool) $item->current,
			'children' => array(),
			'_parent'  => (int) $item->menu_item_parent,
		);
	}

	$tree = array();
	foreach ( $nodes as &$node ) {
		$parent = $node['_parent'];
		unset( $node['_parent'] );
		if ( $parent && isset( $nodes[ $parent ] ) ) {
			$nodes[ $parent ]['children'][] = &$node;
		} else {
			$tree[] = &$node;
		}
	}
	unset( $node );

	return $tree;
}

/**
 * Contact channels from Settings (empty strings when not configured).
 *
 * @return array<string, string>
 */
function contact_data(): array {
	$services = services();
	if ( null === $services ) {
		return array();
	}

	$settings = $services->settings;

	return array(
		'company'  => (string) $settings->get( 'company_name', 'Suntourz' ),
		'phone'    => (string) $settings->get( 'phone', '' ),
		'whatsapp' => preg_replace( '/\D+/', '', (string) $settings->get( 'whatsapp', '' ) ) ?? '',
		'line'     => (string) $settings->get( 'line_id', '' ),
		'telegram' => ltrim( (string) $settings->get( 'telegram', '' ), '@' ),
		'email'    => (string) $settings->get( 'support_email', '' ),
		'response' => (string) $settings->get( 'response_time_text', '' ),
		'instagram' => esc_url_raw( (string) $settings->get( 'instagram_url', '' ) ),
		'facebook' => esc_url_raw( (string) $settings->get( 'facebook_url', '' ) ),
	);
}

/**
 * Initial data shared by every page.
 *
 * @param array<string, mixed> $payload Page-specific data.
 * @return array<string, mixed>
 */
function site_data( string $page, array $payload = array() ): array {
	$services = services();

	return array(
		'page'     => $page,
		'site'     => array(
			'name'         => get_bloginfo( 'name' ),
			'description'  => get_bloginfo( 'description' ),
			'url'          => home_url( '/' ),
			'toursUrl'     => (string) get_post_type_archive_link( 'stz_tour' ),
			'blogUrl'      => blog_url(),
			'planUrl'      => plan_my_trip_url(),
			'bookingSuccessUrl' => template_page_url( 'template-booking-success.php', home_url( '/booking/success/' ) ),
			'restUrl'      => esc_url_raw( rest_url() ),
			'locale'       => get_locale(),
			'pluginActive' => null !== $services,
		),
		'menus'    => array(
			'primary' => menu_tree( 'primary' ),
			'footer'  => menu_tree( 'footer' ),
		),
		'contact'  => contact_data(),
		'booking'  => array(
			'turnstileKey' => null === $services ? '' : $services->turnstile->site_key(),
			'terms'        => null === $services ? '' : (string) $services->settings->get( 'booking_terms', '' ),
		),
		'content'  => null === $services ? (object) array() : $services->content->shared(),
		'currency' => null === $services ? null : $services->settings->currency(),
		'topTours' => null === $services ? array() : array_map(
			static fn ( array $t ): array => array(
				'id'            => $t['id'],
				'title'         => $t['title'],
				'url'           => $t['url'],
				'duration_days' => $t['duration_days'],
				'destination'   => $t['destinations'][0]['name'] ?? '',
			),
			$services->catalog->search(
				array(
					'featured' => true,
					'per_page' => 4,
				)
			)['items']
		),
		'destinations' => null === $services ? array() : array_map(
			static fn ( array $d ): array => array(
				'id'   => $d['id'],
				'slug' => $d['slug'],
				'name' => $d['name'],
				'url'  => $d['url'],
			),
			$services->terms->destinations()
		),
		'styles'   => null === $services ? array() : array_map(
			static fn ( array $d ): array => array(
				'id'   => $d['id'],
				'slug' => $d['slug'],
				'name' => $d['name'],
				'url'  => $d['url'],
			),
			$services->terms->styles()
		),
		'breadcrumbs' => breadcrumb_trail(),
		'payload'  => (object) $payload,
	);
}

/**
 * URL of the page that uses the "Plan My Trip" template (falls back to the hash handled by React).
 */
function plan_my_trip_url(): string {
	return template_page_url( 'template-plan-my-trip.php', home_url( '/#plan-my-trip' ) );
}

/**
 * Permalink of the first page using a page template, or $fallback.
 */
function template_page_url( string $template, string $fallback ): string {
	$pages = get_pages(
		array(
			'meta_key'   => '_wp_page_template', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_value' => $template, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			'number'     => 1,
		)
	);

	return $pages ? (string) get_permalink( $pages[0] ) : $fallback;
}

/**
 * Prints the React mount node (with server-rendered fallback inside) and the JSON payload.
 *
 * @param string               $page     React page name (see frontend/src/lib/types.ts PageName).
 * @param string               $fallback Already-escaped semantic HTML shown without JS / to crawlers.
 * @param array<string, mixed> $payload  Page-specific data for React.
 */
function render_mount( string $page, string $fallback, array $payload = array() ): void {
	$json = wp_json_encode( site_data( $page, $payload ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES );

	// The JSON is HEX-escaped (no "<" or "&"), so it cannot break out of the script element.
	printf(
		'<script type="application/json" id="stz-data">%s</script>' . "\n",
		$json // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	);

	printf(
		'<div id="stz-root" data-page="%s">%s</div>' . "\n",
		esc_attr( $page ),
		$fallback // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	);
}
