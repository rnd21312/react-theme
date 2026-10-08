<?php
/**
 * Single tour — mounts the React `TourSingle` page.
 *
 * @package Suntourz\Theme
 */

use function Suntourz\Theme\money;
use function Suntourz\Theme\print_tour_json_ld;
use function Suntourz\Theme\related_tours;
use function Suntourz\Theme\render_mount;
use function Suntourz\Theme\services;

defined( 'ABSPATH' ) || exit;

get_header();

$stz  = services();
$tour = null !== $stz ? $stz->catalog->get( get_the_ID() ) : null;

if ( null === $tour ) {
	// Plugin inactive: still render the post so the page is never blank.
	ob_start();
	?>
	<main><h1><?php the_title(); ?></h1><?php the_content(); ?></main>
	<?php
	render_mount( 'NotFound', (string) ob_get_clean() );
	get_footer();
	return;
}

$currency = $stz->settings->currency();

ob_start();
?>
<main>
	<h1><?php echo esc_html( (string) $tour['title'] ); ?></h1>
	<p><?php echo esc_html( (string) $tour['excerpt'] ); ?></p>
	<?php if ( null !== $tour['price_from'] ) : ?>
		<p><?php echo esc_html( sprintf( /* translators: %s: price. */ __( 'From %s', 'suntourz' ), money( (int) $tour['price_from'], $currency ) ) ); ?></p>
	<?php endif; ?>
	<?php echo wp_kses_post( (string) $tour['content'] ); ?>
	<?php if ( ! empty( $tour['highlights'] ) ) : ?>
		<h2><?php esc_html_e( 'Highlights', 'suntourz' ); ?></h2>
		<ul><?php foreach ( $tour['highlights'] as $item ) : ?><li><?php echo esc_html( (string) $item ); ?></li><?php endforeach; ?></ul>
	<?php endif; ?>
	<?php if ( ! empty( $tour['itinerary'] ) ) : ?>
		<h2><?php esc_html_e( 'Itinerary', 'suntourz' ); ?></h2>
		<ol>
			<?php foreach ( $tour['itinerary'] as $day ) : ?>
				<li><strong><?php echo esc_html( (string) $day['title'] ); ?></strong> — <?php echo esc_html( (string) $day['description'] ); ?></li>
			<?php endforeach; ?>
		</ol>
	<?php endif; ?>
	<?php if ( ! empty( $tour['includes'] ) ) : ?>
		<h2><?php esc_html_e( 'Included', 'suntourz' ); ?></h2>
		<ul><?php foreach ( $tour['includes'] as $item ) : ?><li><?php echo esc_html( (string) $item ); ?></li><?php endforeach; ?></ul>
	<?php endif; ?>
</main>
<?php
render_mount(
	'TourSingle',
	(string) ob_get_clean(),
	array(
		'tour'    => $tour,
		'reviews' => $stz->reviews->list( (int) $tour['id'], 1, 10 ),
		'related' => related_tours( $tour, $stz, 3 ),
	)
);
print_tour_json_ld( $tour, $currency );

get_footer();
