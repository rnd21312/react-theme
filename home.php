<?php
/**
 * Blog / Travel Guide index — mounts the React `Articles` page.
 *
 * Also serves category / tag archives and search (index.php requires this file), so every
 * editorial listing shares one filterable page.
 *
 * @package Suntourz\Theme
 */

use function Suntourz\Theme\fallback_article_list;
use function Suntourz\Theme\render_mount;
use function Suntourz\Theme\services;

defined( 'ABSPATH' ) || exit;

get_header();

$stz = services();

// phpcs:disable WordPress.Security.NonceVerification.Recommended -- public read-only filters.
$get = static fn ( string $key ): string => isset( $_GET[ $key ] ) ? sanitize_text_field( wp_unslash( (string) $_GET[ $key ] ) ) : '';
// phpcs:enable

$preset  = array();
$heading = '';
$intro   = '';

if ( is_category() || is_tag() ) {
	$term = get_queried_object();
	if ( $term instanceof WP_Term ) {
		$preset[ is_category() ? 'category' : 'tag' ] = $term->slug;
		$heading                                       = html_entity_decode( $term->name, ENT_QUOTES, 'UTF-8' );
		$intro                                         = wp_strip_all_tags( $term->description );
	}
}

$search  = is_search() ? get_search_query( false ) : $get( 'q' );
$sort    = in_array( $get( 'sort' ), array( 'newest', 'oldest', 'title_asc', 'title_desc' ), true ) ? $get( 'sort' ) : 'newest';
$page    = max( 1, (int) get_query_var( 'paged' ), (int) $get( 'page' ) );
$filters = array_filter(
	array(
		'category' => $preset['category'] ?? $get( 'category' ),
		'tag'      => $preset['tag'] ?? $get( 'tag' ),
		'search'   => $search,
		'sort'     => 'newest' === $sort ? '' : $sort,
		'page'     => $page > 1 ? $page : '',
	),
	static fn ( $value ): bool => '' !== $value
);

$result = null === $stz ? null : $stz->articles->list(
	$page,
	9,
	(string) ( $filters['category'] ?? '' ),
	(string) ( $filters['search'] ?? '' ),
	$sort,
	(string) ( $filters['tag'] ?? '' )
);
$guide  = $stz?->content->all()['guide'] ?? array();
$title  = '' !== $heading ? $heading : (string) ( $guide['title'] ?? __( 'Travel Guide', 'suntourz' ) );

ob_start();
?>
<main>
	<h1><?php echo esc_html( $title ); ?></h1>
	<?php if ( '' !== $intro ) : ?>
		<p><?php echo esc_html( $intro ); ?></p>
	<?php endif; ?>
	<?php echo fallback_article_list( $result['items'] ?? array() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
</main>
<?php
render_mount(
	'Articles',
	(string) ob_get_clean(),
	array(
		'result'     => $result,
		'content'    => $guide,
		'heading'    => $heading,
		'intro'      => $intro,
		'preset'     => $preset,
		'filters'    => $filters,
		'categories' => null === $stz ? array() : $stz->articles->categories(),
		'tags'       => null === $stz ? array() : $stz->articles->tags(),
		'recent'     => null === $stz ? array() : $stz->articles->list( 1, 4 )['items'],
	)
);

get_footer();
