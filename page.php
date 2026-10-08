<?php
/**
 * Generic page (About, Contact, Terms…) — WordPress content inside the React layout.
 *
 * @package Suntourz\Theme
 */

use function Suntourz\Theme\render_mount;
use function Suntourz\Theme\services;

defined( 'ABSPATH' ) || exit;

get_header();

$stz = services();

while ( have_posts() ) :
	the_post();

	$content = apply_filters( 'the_content', get_the_content() ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- core filter.

	ob_start();
	?>
	<main>
		<h1><?php the_title(); ?></h1>
		<?php echo wp_kses_post( $content ); ?>
	</main>
	<?php
	render_mount(
		'Page',
		(string) ob_get_clean(),
		array(
			'title'   => html_entity_decode( get_the_title(), ENT_QUOTES, 'UTF-8' ),
			'content' => $content,
			'image'   => (string) get_the_post_thumbnail_url( null, 'large' ),
			'tours'   => null === $stz ? array() : $stz->catalog->search(
				array(
					'featured' => true,
					'per_page' => 3,
				)
			)['items'],
		)
	);
endwhile;

get_footer();
