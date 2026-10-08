<?php
/**
 * 404 — mounts the React `NotFound` page.
 *
 * @package Suntourz\Theme
 */

defined( 'ABSPATH' ) || exit;

get_header();

ob_start();
?>
<main>
	<h1><?php esc_html_e( 'Page not found', 'suntourz' ); ?></h1>
	<p><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to home', 'suntourz' ); ?></a></p>
</main>
<?php
\Suntourz\Theme\render_mount( 'NotFound', (string) ob_get_clean() );

get_footer();
