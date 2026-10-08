<?php
/**
 * Tours archive — mounts the React `ToursArchive` page, pre-filtered from the query string.
 *
 * @package Suntourz\Theme
 */

use function Suntourz\Theme\fallback_tour_list;
use function Suntourz\Theme\print_tour_list_json_ld;
use function Suntourz\Theme\render_mount;
use function Suntourz\Theme\services;
use function Suntourz\Theme\tour_filters_from_request;

defined( 'ABSPATH' ) || exit;

get_header();

$stz     = services();
$preset  = array();
$heading = __( 'Tours', 'suntourz' );
$intro   = '';

// Taxonomy pages (destinations / travel styles) reuse this page with a preset filter.
if ( is_tax() ) {
	$term = get_queried_object();
	if ( $term instanceof WP_Term ) {
		$preset  = array( ( 'stz_style' === $term->taxonomy ? 'style' : 'destination' ) => $term->slug );
		$heading = $term->name;
		$intro   = wp_strip_all_tags( $term->description );
	}
}

$filters = tour_filters_from_request( $preset );
$result  = null === $stz ? null : $stz->catalog->search( $filters + array( 'per_page' => 12 ) );

ob_start();
?>
<main>
	<h1><?php echo esc_html( $heading ); ?></h1>
	<?php if ( '' !== $intro ) : ?>
		<p><?php echo esc_html( $intro ); ?></p>
	<?php endif; ?>
	<?php echo fallback_tour_list( $result['items'] ?? array(), $stz ? $stz->settings->currency() : null ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
</main>
<?php
render_mount(
	'ToursArchive',
	(string) ob_get_clean(),
	array(
		'heading'      => $heading,
		'page'         => null === $stz ? array() : ( $stz->content->all()['tours_page'] ?? array() ),
		'intro'        => $intro,
		'preset'       => $preset,
		'filters'      => $filters,
		'result'       => $result,
		'destinations' => null === $stz ? array() : $stz->terms->destinations(),
		'styles'       => null === $stz ? array() : $stz->terms->styles(),
	)
);

print_tour_list_json_ld( $result['items'] ?? array(), $heading );

get_footer();
