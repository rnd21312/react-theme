<?php
/**
 * Single article — mounts the React `Article` page.
 *
 * @package Suntourz\Theme
 */

use function Suntourz\Theme\print_article_json_ld;
use function Suntourz\Theme\render_mount;
use function Suntourz\Theme\services;

defined( 'ABSPATH' ) || exit;

get_header();

$stz     = services();
$article = null !== $stz ? $stz->articles->get( get_the_ID() ) : null;

if ( null === $article ) {
	ob_start();
	?>
	<main><h1><?php the_title(); ?></h1><?php the_content(); ?></main>
	<?php
	render_mount( 'NotFound', (string) ob_get_clean() );
	get_footer();
	return;
}

// Keep reading: same category first, then the newest articles.
$related = array();
foreach ( array( (string) ( $article['category_slug'] ?? '' ), '' ) as $category ) {
	foreach ( $stz->articles->list( 1, 6, $category )['items'] as $item ) {
		if ( $item['id'] !== $article['id'] && ! isset( $related[ $item['id'] ] ) ) {
			$related[ $item['id'] ] = $item;
		}
	}
	if ( count( $related ) >= 3 ) {
		break;
	}
}

ob_start();
?>
<main>
	<h1><?php echo esc_html( (string) $article['title'] ); ?></h1>
	<p><?php echo esc_html( (string) $article['author'] ); ?> · <?php echo esc_html( (string) $article['date'] ); ?></p>
	<?php echo wp_kses_post( (string) $article['content'] ); ?>
</main>
<?php
render_mount(
	'Article',
	(string) ob_get_clean(),
	array(
		'article' => $article,
		'related' => array_slice( array_values( $related ), 0, 3 ),
		'tours'   => $stz->catalog->search(
			array(
				'featured' => true,
				'per_page' => 3,
			)
		)['items'],
	)
);
print_article_json_ld( $article );

get_footer();
