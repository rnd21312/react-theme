<?php
/**
 * Server-rendered fallback markup (no-JS visitors, crawlers, first paint). Always escaped.
 *
 * @package Suntourz\Theme
 */

declare(strict_types=1);

namespace Suntourz\Theme;

defined( 'ABSPATH' ) || exit;

/**
 * Formats integer minor units like the React formatMoney().
 *
 * @param array<string, mixed>|null $currency Currency settings.
 */
function money( int $minor, ?array $currency ): string {
	$currency = $currency ?? array(
		'symbol'             => '฿',
		'position'           => 'before',
		'decimals'           => 0,
		'thousand_separator' => ',',
		'decimal_separator'  => '.',
		'minor_unit'         => 100,
	);

	$number = number_format( $minor / (int) $currency['minor_unit'], (int) $currency['decimals'], (string) $currency['decimal_separator'], (string) $currency['thousand_separator'] );

	return 'after' === $currency['position'] ? $number . ' ' . $currency['symbol'] : $currency['symbol'] . $number;
}

/**
 * @param array<int, array<string, mixed>> $tours    Tour cards.
 * @param array<string, mixed>|null        $currency Currency settings.
 */
function fallback_tour_list( array $tours, ?array $currency ): string {
	if ( array() === $tours ) {
		return '';
	}

	$html = '<ul>';
	foreach ( $tours as $tour ) {
		$html .= sprintf(
			'<li><a href="%s">%s</a>%s%s</li>',
			esc_url( (string) $tour['url'] ),
			esc_html( (string) $tour['title'] ),
			' — ' . esc_html( sprintf( /* translators: %d: days. */ _n( '%d day', '%d days', (int) $tour['duration_days'], 'suntourz' ), (int) $tour['duration_days'] ) ),
			null !== $tour['price_from'] ? ' — ' . esc_html( sprintf( /* translators: %s: price. */ __( 'from %s', 'suntourz' ), money( (int) $tour['price_from'], $currency ) ) ) : ''
		);
	}

	return $html . '</ul>';
}

/**
 * @param array<int, array<string, mixed>> $articles Article cards.
 */
function fallback_article_list( array $articles ): string {
	if ( array() === $articles ) {
		return '';
	}

	$html = '<ul>';
	foreach ( $articles as $article ) {
		$html .= sprintf(
			'<li><a href="%s">%s</a><p>%s</p></li>',
			esc_url( (string) $article['url'] ),
			esc_html( (string) $article['title'] ),
			esc_html( (string) $article['excerpt'] )
		);
	}

	return $html . '</ul>';
}
