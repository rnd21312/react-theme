<?php
/**
 * Home — mounts the React `Home` page with everything it needs in the first paint.
 *
 * @package Suntourz\Theme
 */

use function Suntourz\Theme\fallback_article_list;
use function Suntourz\Theme\fallback_tour_list;
use function Suntourz\Theme\print_home_json_ld;
use function Suntourz\Theme\render_mount;
use function Suntourz\Theme\services;

defined( 'ABSPATH' ) || exit;

get_header();

$stz      = services();
$payload  = array();
$tours    = array();
$articles = array();
$currency = null;
$content  = array();

if ( null !== $stz ) {
	$featured = $stz->catalog->search(
		array(
			'featured' => true,
			'per_page' => 5,
		)
	);
	// Fall back to the newest tours when nothing is flagged as featured yet.
	if ( 0 === $featured['total'] ) {
		$featured = $stz->catalog->search( array( 'per_page' => 5 ) );
	}

	$finder   = $stz->catalog->search( array( 'per_page' => 6 ) );
	$reviews  = $stz->reviews->list( 0, 1, 4, 4 );
	$articles = $stz->articles->list( 1, 6 );
	$currency = $stz->settings->currency();
	$content  = $stz->content->all();
	$tours    = $featured['items'];

	$payload = array(
		'featured'     => $featured['items'],
		'toursTotal'   => $finder['total'],
		'finder'       => $finder,
		'destinations' => $stz->terms->destinations(),
		'styles'       => $stz->terms->styles(),
		'articles'     => $articles['items'],
		'reviews'      => array(
			'items'   => $reviews['items'],
			'overall' => $stz->reviews->overall(),
		),
		'content'      => $content,
	);
	$articles = $articles['items'];
}

$hero = $content['hero'] ?? array();

ob_start();
?>
<main>
	<h1><?php echo esc_html( trim( ( $hero['title'] ?? get_bloginfo( 'name' ) ) . ' ' . ( $hero['title_accent'] ?? '' ) ) ); ?></h1>
	<p><?php echo esc_html( (string) ( $hero['subtitle'] ?? get_bloginfo( 'description' ) ) ); ?></p>
	<?php if ( array() !== $tours ) : ?>
		<h2><?php echo esc_html( (string) ( $content['featured']['title'] ?? __( 'Featured tours', 'suntourz' ) ) ); ?></h2>
		<?php echo fallback_tour_list( $tours, $currency ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helper. ?>
	<?php endif; ?>
	<?php if ( array() !== $articles ) : ?>
		<h2><?php echo esc_html( (string) ( $content['guide']['title'] ?? __( 'Travel guide', 'suntourz' ) ) ); ?></h2>
		<?php echo fallback_article_list( $articles ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	<?php endif; ?>
</main>
<?php
render_mount( 'Home', (string) ob_get_clean(), $payload );
print_home_json_ld();

get_footer();
