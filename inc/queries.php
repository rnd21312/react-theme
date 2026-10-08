<?php
/**
 * Reads tour filters from the URL query string (same names as the REST API) so the
 * server-rendered first paint matches what React shows.
 *
 * @package Suntourz\Theme
 */

declare(strict_types=1);

namespace Suntourz\Theme;

defined( 'ABSPATH' ) || exit;

/**
 * @param array<string, string> $preset Filters forced by the route (e.g. destination from the term page).
 * @return array<string, mixed>
 */
function tour_filters_from_request( array $preset = array() ): array {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- public read-only filters.
	$get = static fn ( string $key ): string => isset( $_GET[ $key ] ) ? sanitize_text_field( wp_unslash( (string) $_GET[ $key ] ) ) : '';

	$filters = array();

	foreach ( array( 'destination', 'style', 'search' ) as $key ) {
		if ( '' !== $get( $key ) ) {
			$filters[ $key ] = $get( $key );
		}
	}

	if ( preg_match( '/^\d{4}-(0[1-9]|1[0-2])$/', $get( 'month' ) ) ) {
		$filters['month'] = $get( 'month' );
	}

	foreach ( array( 'duration_min', 'duration_max', 'price_min', 'price_max', 'pax', 'page' ) as $key ) {
		if ( ctype_digit( $get( $key ) ) && (int) $get( $key ) > 0 ) {
			$filters[ $key ] = (int) $get( $key );
		}
	}

	foreach ( array( 'discount', 'last_minute', 'special_offer', 'featured' ) as $key ) {
		if ( '1' === $get( $key ) ) {
			$filters[ $key ] = true;
		}
	}

	$sort = $get( 'sort' );
	if ( in_array( $sort, array( 'recommended', 'price_asc', 'price_desc', 'date_asc', 'duration_asc', 'newest' ), true ) ) {
		$filters['sort'] = $sort;
	}
	// phpcs:enable

	return array_merge( $filters, $preset );
}

/**
 * "More tours you may like": same destination first, then same travel style, then the rest of the
 * catalogue — never the tour being viewed.
 *
 * @param array<string, mixed>  $tour  Current tour payload.
 * @param \Suntourz\Core\Container $stz Core services.
 * @return array<int, array<string, mixed>>
 */
function related_tours( array $tour, \Suntourz\Core\Container $stz, int $limit = 3 ): array {
	$current = (int) $tour['id'];
	$picked  = array();

	$searches = array();
	foreach ( (array) ( $tour['destinations'] ?? array() ) as $destination ) {
		$searches[] = array( 'destination' => $destination['slug'] );
	}
	foreach ( (array) ( $tour['styles'] ?? array() ) as $style ) {
		$searches[] = array( 'style' => $style['slug'] );
	}
	$searches[] = array();

	foreach ( $searches as $filters ) {
		$found = $stz->catalog->search( $filters + array( 'per_page' => $limit + 4 ) );
		foreach ( $found['items'] as $item ) {
			if ( (int) $item['id'] !== $current && ! isset( $picked[ $item['id'] ] ) ) {
				$picked[ $item['id'] ] = $item;
			}
		}
		if ( count( $picked ) >= $limit ) {
			break;
		}
	}

	return array_slice( array_values( $picked ), 0, $limit );
}
