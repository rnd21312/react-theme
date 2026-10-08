<?php
/**
 * SEO: titles, meta descriptions, canonical + robots rules, Open Graph / Twitter cards,
 * breadcrumbs and JSON-LD. Skipped when a dedicated SEO plugin is active.
 *
 * @package Suntourz\Theme
 */

declare(strict_types=1);

namespace Suntourz\Theme;

defined( 'ABSPATH' ) || exit;

/**
 * Prints one JSON-LD block (the JSON is HEX-escaped so it cannot close the script tag).
 *
 * @param array<string, mixed> $data Schema.org graph.
 */
function print_json_ld( array $data ): void {
	printf(
		'<script type="application/ld+json">%s</script>' . "\n",
		wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	);
}

function seo_plugin_active(): bool {
	return defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) || defined( 'AIOSEO_VERSION' );
}

/* ------------------------------------------------------------------ Helpers */

/**
 * Permalink of the blog / travel-guide index.
 */
function blog_url(): string {
	$page_id = (int) get_option( 'page_for_posts' );

	return $page_id > 0 ? (string) get_permalink( $page_id ) : home_url( '/blog/' );
}

function is_tour_archive(): bool {
	return is_post_type_archive( 'stz_tour' ) || is_tax( array( 'stz_destination', 'stz_style' ) );
}

/**
 * Whether the page is the editorial listing (blog index, category, tag).
 */
function is_blog_listing(): bool {
	return is_home() || is_category() || is_tag() || is_search();
}

/**
 * Whether the request carries listing filters that should not be indexed as separate pages.
 */
function has_listing_filters(): bool {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- public read-only filters.
	foreach ( array( 'search', 'destination', 'style', 'month', 'duration_min', 'duration_max', 'price_min', 'price_max', 'pax', 'discount', 'last_minute', 'special_offer', 'featured', 'sort', 'q', 'category', 'tag', 's' ) as $key ) {
		if ( isset( $_GET[ $key ] ) && '' !== (string) $_GET[ $key ] ) {
			return true;
		}
	}
	// phpcs:enable

	return false;
}

/**
 * Pages that should stay out of search results.
 */
function seo_noindex(): bool {
	if ( is_404() || is_search() ) {
		return true;
	}
	if ( seo_override()['noindex'] ) {
		return true;
	}
	if ( ( is_tour_archive() || is_blog_listing() ) && has_listing_filters() ) {
		return true;
	}
	if ( is_page_template( 'template-booking-success.php' ) ) {
		return true;
	}

	return false;
}

add_filter(
	'wp_robots',
	static function ( array $robots ): array {
		if ( seo_plugin_active() ) {
			return $robots;
		}
		if ( seo_noindex() ) {
			$robots['noindex'] = true;
			$robots['follow']  = true;
			unset( $robots['index'] );
		} else {
			$robots['max-snippet']       = '-1';
			$robots['max-video-preview'] = '-1';
		}

		return $robots;
	}
);

/**
 * Canonical URL of the current view (filters and tracking parameters are dropped).
 */
function seo_canonical(): string {
	$url = home_url( '/' );

	if ( is_front_page() ) {
		$url = home_url( '/' );
	} elseif ( is_singular() ) {
		$url = (string) get_permalink();
	} elseif ( is_post_type_archive( 'stz_tour' ) ) {
		$url = (string) get_post_type_archive_link( 'stz_tour' );
	} elseif ( is_tax() || is_category() || is_tag() ) {
		$term = get_queried_object();
		$link = $term instanceof \WP_Term ? get_term_link( $term ) : '';
		$url  = is_string( $link ) && '' !== $link ? $link : $url;
	} elseif ( is_home() ) {
		$url = blog_url();
	}

	$paged = max( 1, (int) get_query_var( 'paged' ) );
	if ( $paged > 1 && ! is_singular() ) {
		$url = trailingslashit( $url ) . 'page/' . $paged . '/';
	}

	return (string) apply_filters( 'stz_seo_canonical', $url );
}

add_action(
	'wp_head',
	static function (): void {
		if ( seo_plugin_active() || is_singular() || seo_noindex() ) {
			return; // Core prints the canonical of singular pages; noindex pages need none.
		}
		printf( '<link rel="canonical" href="%s">' . "\n", esc_url( seo_canonical() ) );
	},
	2
);

/* ------------------------------------------------------------------ Titles & descriptions */

// Descriptive titles for the listing pages.
add_filter(
	'document_title_parts',
	static function ( array $parts ): array {
		if ( seo_plugin_active() ) {
			return $parts;
		}

		if ( is_post_type_archive( 'stz_tour' ) ) {
			$parts['title'] = __( 'Thailand Tours & Holiday Packages', 'suntourz' );
		} elseif ( is_tax( 'stz_destination' ) ) {
			/* translators: %s: destination name. */
			$parts['title'] = sprintf( __( '%s Tours & Holidays', 'suntourz' ), single_term_title( '', false ) );
		} elseif ( is_tax( 'stz_style' ) ) {
			/* translators: %s: travel style name. */
			$parts['title'] = sprintf( __( '%s Tours in Thailand', 'suntourz' ), single_term_title( '', false ) );
		} elseif ( is_home() && ! is_front_page() ) {
			$parts['title'] = __( 'Thailand Travel Guide — Tips, Itineraries & Inspiration', 'suntourz' );
		} elseif ( is_category() ) {
			/* translators: %s: category name. */
			$parts['title'] = sprintf( __( '%s — Thailand Travel Guide', 'suntourz' ), single_cat_title( '', false ) );
		}

		$override = seo_override();
		if ( '' !== $override['title'] ) {
			if ( is_front_page() ) {
				return array( 'title' => $override['title'] );
			}
			$parts['title'] = $override['title'];
		}

		return $parts;
	}
);

/**
 * @return array{title: string, description: string, image: string, type: string, published: string}
 */
function seo_context(): array {
	$description = get_bloginfo( 'description' );
	$image       = '';
	$type        = 'website';
	$published   = '';
	$title       = wp_get_document_title();
	$stz         = services();
	$content     = null === $stz ? array() : $stz->content->all();

	if ( is_front_page() ) {
		$hero        = $content['hero'] ?? array();
		$description = (string) ( $hero['subtitle'] ?? $description );
		$image       = (string) ( $hero['image'] ?? '' );
	} elseif ( is_singular() ) {
		$post = get_queried_object();
		if ( $post instanceof \WP_Post ) {
			// Block tags become spaces first, so headings and list items do not run into each other.
			$plain       = wp_strip_all_tags( (string) preg_replace( '/<\/?(p|li|ul|ol|h[1-6]|div|br|blockquote)[^>]*>/i', ' ', strip_shortcodes( $post->post_content ) ) );
			$excerpt     = has_excerpt( $post ) ? $post->post_excerpt : wp_trim_words( $plain, 32, '…' );
			$description = '' !== trim( $excerpt ) ? $excerpt : $description;
			$image       = (string) get_the_post_thumbnail_url( $post, 'large' );
			$type        = 'post' === $post->post_type ? 'article' : 'website';
			$published   = 'post' === $post->post_type ? (string) get_post_time( 'c', true, $post ) : '';
		}
	} elseif ( is_post_type_archive( 'stz_tour' ) ) {
		$description = (string) ( $content['finder']['subtitle'] ?? '' );
		/* translators: %s: finder subtitle. */
		$description = sprintf( __( 'Browse Thailand tours and holiday packages: Bangkok, Chiang Mai, Phuket and more. %s', 'suntourz' ), $description );
	} elseif ( is_tax() || is_category() || is_tag() ) {
		$term = get_queried_object();
		if ( $term instanceof \WP_Term ) {
			if ( '' !== trim( $term->description ) ) {
				$description = wp_strip_all_tags( $term->description );
			} elseif ( is_tax() ) {
				/* translators: %s: term name. */
				$description = sprintf( __( 'Handpicked %s tours in Thailand with local specialists, small groups and clear pricing. Compare itineraries and book your dates.', 'suntourz' ), $term->name );
			} else {
				/* translators: %s: term name. */
				$description = sprintf( __( 'Thailand travel guide articles about %s: planning tips, seasons, itineraries and local insight.', 'suntourz' ), $term->name );
			}
		}
	} elseif ( is_home() ) {
		$description = (string) ( $content['guide']['subtitle'] ?? $description );
	}

	if ( '' === $image ) {
		$image = (string) ( $content['hero']['image'] ?? '' );
	}

	$override = seo_override();
	if ( '' !== $override['title'] ) {
		$title = $override['title'];
	}
	if ( '' !== $override['description'] ) {
		$description = $override['description'];
	}
	if ( '' !== $override['image'] && ( ! is_singular() || '' === $image || get_post_meta( (int) get_queried_object_id(), '_stz_seo_image', true ) ) ) {
		$image = $override['image'];
	}

	return array(
		'title'       => $title,
		'description' => mb_substr( trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( html_entity_decode( $description, ENT_QUOTES, 'UTF-8' ) ) ) ?? '' ), 0, 300 ),
		'image'       => $image,
		'type'        => $type,
		'published'   => $published,
	);
}

add_action(
	'wp_head',
	static function (): void {
		if ( seo_plugin_active() ) {
			return;
		}

		$seo = seo_context();
		if ( '' !== $seo['description'] ) {
			printf( '<meta name="description" content="%s">' . "\n", esc_attr( $seo['description'] ) );
		}

		$url = seo_canonical();
		printf( '<meta property="og:site_name" content="%s">' . "\n", esc_attr( get_bloginfo( 'name' ) ) );
		printf( '<meta property="og:locale" content="%s">' . "\n", esc_attr( get_locale() ) );
		printf( '<meta property="og:type" content="%s">' . "\n", esc_attr( $seo['type'] ) );
		printf( '<meta property="og:title" content="%s">' . "\n", esc_attr( $seo['title'] ) );
		printf( '<meta property="og:description" content="%s">' . "\n", esc_attr( $seo['description'] ) );
		printf( '<meta property="og:url" content="%s">' . "\n", esc_url( $url ) );
		if ( '' !== $seo['published'] ) {
			printf( '<meta property="article:published_time" content="%s">' . "\n", esc_attr( $seo['published'] ) );
		}
		if ( '' !== $seo['image'] ) {
			printf( '<meta property="og:image" content="%s">' . "\n", esc_url( $seo['image'] ) );
			printf( '<meta name="twitter:image" content="%s">' . "\n", esc_url( $seo['image'] ) );
		}
		printf( '<meta name="twitter:card" content="%s">' . "\n", '' !== $seo['image'] ? 'summary_large_image' : 'summary' );
		printf( '<meta name="twitter:title" content="%s">' . "\n", esc_attr( $seo['title'] ) );
		printf( '<meta name="twitter:description" content="%s">' . "\n", esc_attr( $seo['description'] ) );
	},
	3
);

/* ------------------------------------------------------------------ Breadcrumbs */

/**
 * Breadcrumb trail of the current view: [ { name, url } … ] without the home entry.
 *
 * @return array<int, array{name: string, url: string}>
 */
function breadcrumb_trail(): array {
	$trail = array();
	$push  = static function ( string $name, string $url ) use ( &$trail ): void {
		if ( '' !== $name ) {
			$trail[] = array(
				'name' => html_entity_decode( $name, ENT_QUOTES, 'UTF-8' ),
				'url'  => $url,
			);
		}
	};
	$tours = (string) get_post_type_archive_link( 'stz_tour' );

	if ( is_front_page() ) {
		return array();
	}

	if ( is_singular( 'stz_tour' ) ) {
		$push( __( 'Tours', 'suntourz' ), $tours );
		$terms = get_the_terms( (int) get_queried_object_id(), 'stz_destination' );
		if ( is_array( $terms ) && isset( $terms[0] ) ) {
			$link = get_term_link( $terms[0] );
			$push( $terms[0]->name, is_string( $link ) ? $link : '' );
		}
		$push( get_the_title(), (string) get_permalink() );
	} elseif ( is_post_type_archive( 'stz_tour' ) ) {
		$push( __( 'Tours', 'suntourz' ), $tours );
	} elseif ( is_tax( array( 'stz_destination', 'stz_style' ) ) ) {
		$push( __( 'Tours', 'suntourz' ), $tours );
		$term = get_queried_object();
		if ( $term instanceof \WP_Term ) {
			$link = get_term_link( $term );
			$push( $term->name, is_string( $link ) ? $link : '' );
		}
	} elseif ( is_singular( 'post' ) ) {
		$push( __( 'Travel Guide', 'suntourz' ), blog_url() );
		$categories = get_the_category();
		if ( isset( $categories[0] ) ) {
			$push( $categories[0]->name, (string) get_category_link( $categories[0] ) );
		}
		$push( get_the_title(), (string) get_permalink() );
	} elseif ( is_category() || is_tag() ) {
		$push( __( 'Travel Guide', 'suntourz' ), blog_url() );
		$term = get_queried_object();
		if ( $term instanceof \WP_Term ) {
			$link = get_term_link( $term );
			$push( $term->name, is_string( $link ) ? $link : '' );
		}
	} elseif ( is_home() || is_search() ) {
		$push( __( 'Travel Guide', 'suntourz' ), blog_url() );
	} elseif ( is_page() ) {
		foreach ( array_reverse( get_post_ancestors( (int) get_queried_object_id() ) ) as $ancestor ) {
			$push( get_the_title( $ancestor ), (string) get_permalink( $ancestor ) );
		}
		$push( get_the_title(), (string) get_permalink() );
	} elseif ( is_404() ) {
		$push( __( 'Page not found', 'suntourz' ), '' );
	}

	return $trail;
}

/**
 * BreadcrumbList schema for every page except the home page.
 */
add_action(
	'wp_footer',
	static function (): void {
		$trail = breadcrumb_trail();
		if ( array() === $trail ) {
			return;
		}

		$items = array(
			array(
				'@type'    => 'ListItem',
				'position' => 1,
				'name'     => get_bloginfo( 'name' ),
				'item'     => home_url( '/' ),
			),
		);
		foreach ( $trail as $index => $crumb ) {
			$entry = array(
				'@type'    => 'ListItem',
				'position' => $index + 2,
				'name'     => $crumb['name'],
			);
			if ( '' !== $crumb['url'] ) {
				$entry['item'] = $crumb['url'];
			}
			$items[] = $entry;
		}

		print_json_ld(
			array(
				'@context'        => 'https://schema.org',
				'@type'           => 'BreadcrumbList',
				'itemListElement' => $items,
			)
		);
	},
	5
);

/* ------------------------------------------------------------------ Structured data */

/**
 * TouristTrip schema for a tour (data comes from the catalog payload).
 *
 * @param array<string, mixed>      $tour     Tour detail payload.
 * @param array<string, mixed>|null $currency Currency settings.
 */
function print_tour_json_ld( array $tour, ?array $currency ): void {
	$minor = (int) ( $currency['minor_unit'] ?? 100 );

	$schema = array(
		'@context'    => 'https://schema.org',
		'@type'       => 'TouristTrip',
		'name'        => $tour['title'],
		'description' => '' !== $tour['excerpt'] ? $tour['excerpt'] : wp_trim_words( wp_strip_all_tags( (string) $tour['content'] ), 40, '…' ),
		'url'         => $tour['url'],
		'touristType' => array_map( static fn ( array $style ): string => (string) $style['name'], (array) ( $tour['styles'] ?? array() ) ),
		'provider'    => array(
			'@type' => 'TravelAgency',
			'name'  => get_bloginfo( 'name' ),
			'url'   => home_url( '/' ),
		),
	);

	if ( ! empty( $tour['image']['url'] ) ) {
		$schema['image'] = $tour['image']['url'];
	}

	if ( null !== $tour['price_from'] ) {
		$schema['offers'] = array(
			'@type'         => 'Offer',
			'price'         => round( (int) $tour['price_from'] / $minor, 2 ),
			'priceCurrency' => (string) $tour['currency_code'],
			'availability'  => $tour['bookable'] ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
			'url'           => $tour['url'],
		);
	}

	if ( (int) $tour['rating']['count'] > 0 ) {
		$schema['aggregateRating'] = array(
			'@type'       => 'AggregateRating',
			'ratingValue' => $tour['rating']['average'],
			'reviewCount' => $tour['rating']['count'],
		);
	}

	if ( ! empty( $tour['itinerary'] ) ) {
		$items = array();
		foreach ( $tour['itinerary'] as $i => $day ) {
			$items[] = array(
				'@type'    => 'ListItem',
				'position' => $i + 1,
				'name'     => trim( 'Day ' . $day['day'] . ': ' . $day['title'] ),
			);
		}
		$schema['itinerary'] = array(
			'@type'           => 'ItemList',
			'itemListElement' => $items,
		);
	}

	print_json_ld( $schema );
}

/**
 * CollectionPage + ItemList for a tours listing (archive, destination, style).
 *
 * @param array<int, array<string, mixed>> $tours   Tour cards on the page.
 * @param string                           $heading Page heading.
 */
function print_tour_list_json_ld( array $tours, string $heading ): void {
	if ( array() === $tours ) {
		return;
	}

	$items = array();
	foreach ( array_values( $tours ) as $i => $tour ) {
		$items[] = array(
			'@type'    => 'ListItem',
			'position' => $i + 1,
			'url'      => $tour['url'],
			'name'     => $tour['title'],
		);
	}

	print_json_ld(
		array(
			'@context'   => 'https://schema.org',
			'@type'      => 'CollectionPage',
			'name'       => $heading,
			'url'        => seo_canonical(),
			'mainEntity' => array(
				'@type'           => 'ItemList',
				'itemListElement' => $items,
			),
		)
	);
}

/**
 * Organization + WebSite schema for the home page.
 */
function print_home_json_ld(): void {
	$contact = contact_data();
	$same_as = array_values( array_filter( array( $contact['instagram'] ?? '', $contact['facebook'] ?? '' ) ) );

	print_json_ld(
		array(
			'@context' => 'https://schema.org',
			'@graph'   => array(
				array(
					'@type'     => 'TravelAgency',
					'@id'       => home_url( '/#organization' ),
					'name'      => get_bloginfo( 'name' ),
					'url'       => home_url( '/' ),
					'telephone' => $contact['phone'] ?? '',
					'areaServed' => 'TH',
					'sameAs'    => $same_as,
				),
				array(
					'@type'           => 'WebSite',
					'@id'             => home_url( '/#website' ),
					'name'            => get_bloginfo( 'name' ),
					'url'             => home_url( '/' ),
					'publisher'       => array( '@id' => home_url( '/#organization' ) ),
					'potentialAction' => array(
						'@type'       => 'SearchAction',
						'target'      => array(
							'@type'       => 'EntryPoint',
							'urlTemplate' => (string) get_post_type_archive_link( 'stz_tour' ) . '?search={search_term_string}',
						),
						'query-input' => 'required name=search_term_string',
					),
				),
			),
		)
	);
}

/**
 * Article schema for a blog post.
 *
 * @param array<string, mixed> $article Article payload.
 */
function print_article_json_ld( array $article ): void {
	$schema = array(
		'@context'         => 'https://schema.org',
		'@type'            => 'Article',
		'headline'         => $article['title'],
		'description'      => $article['excerpt'],
		'mainEntityOfPage' => $article['url'],
		'datePublished'    => (string) get_post_time( 'c', true ),
		'dateModified'     => (string) get_post_modified_time( 'c', true ),
		'author'           => array(
			'@type' => 'Person',
			'name'  => $article['author'],
		),
		'publisher'        => array(
			'@type' => 'Organization',
			'name'  => get_bloginfo( 'name' ),
			'url'   => home_url( '/' ),
		),
	);
	if ( ! empty( $article['image']['url'] ) ) {
		$schema['image'] = $article['image']['url'];
	}

	print_json_ld( $schema );
}
