<?php
/**
 * Brand settings from Suntourz → Settings → Home content: colours and favicon.
 *
 * @package Suntourz\Theme
 */

declare(strict_types=1);

namespace Suntourz\Theme;

defined( 'ABSPATH' ) || exit;

/**
 * Brand block of the editable content (empty array when the core plugin is off).
 *
 * @return array<string, mixed>
 */
function brand_content(): array {
	$services = services();

	return null === $services ? array() : (array) $services->content->all();
}

/**
 * Colour overrides. Only values that differ from the shipped palette are printed; the darker shades
 * of the primary colour are derived from it so one picker re-colours the whole site.
 */
add_action(
	'wp_head',
	static function (): void {
		$design = (array) ( brand_content()['design'] ?? array() );
		$hex    = static fn ( string $key, string $default ): string => preg_match( '/^#[0-9a-f]{6}$/i', (string) ( $design[ $key ] ?? '' ) ) ? (string) $design[ $key ] : $default;

		$primary    = $hex( 'color_primary', '#0e2a23' );
		$accent     = $hex( 'color_accent', '#d4af37' );
		$background = $hex( 'color_background', '#faf8f5' );

		$css = '';
		if ( '#0e2a23' !== strtolower( $primary ) ) {
			$css .= sprintf(
				'--stz-forest:%1$s;--stz-forest-deep:color-mix(in srgb,%1$s 78%%,#000);--stz-forest-soft:color-mix(in srgb,%1$s 82%%,#fff);--stz-forest-night:color-mix(in srgb,%1$s 70%%,#000);',
				$primary
			);
		}
		if ( '#d4af37' !== strtolower( $accent ) ) {
			$css .= sprintf( '--stz-gold:%1$s;--stz-gold-dark:color-mix(in srgb,%1$s 90%%,#000);', $accent );
		}
		if ( '#faf8f5' !== strtolower( $background ) ) {
			$css .= sprintf( '--stz-cream:%1$s;', $background );
		}

		if ( '' !== $css ) {
			printf( '<style id="stz-brand">:root{%s}html{background:var(--stz-cream)}</style>' . "\n", $css ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- values validated as #rrggbb above.
		}
	},
	20 // After the stylesheet, so these :root values win.
);

/**
 * Favicon chosen in the content editor (overrides the WordPress site icon).
 */
add_action(
	'wp_head',
	static function (): void {
		$icon = esc_url( (string) ( ( (array) ( brand_content()['brand'] ?? array() ) )['favicon_image'] ?? '' ) );
		if ( '' === $icon ) {
			return;
		}
		printf( '<link rel="icon" href="%1$s"><link rel="apple-touch-icon" href="%1$s">' . "\n", $icon ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	},
	2
);

// Remove WordPress' own icon tags when a custom favicon is set, so there is one icon only.
add_filter(
	'get_site_icon_url',
	static function ( string $url ): string {
		return '' !== (string) ( ( (array) ( brand_content()['brand'] ?? array() ) )['favicon_image'] ?? '' ) ? '' : $url;
	}
);
