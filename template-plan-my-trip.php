<?php
/**
 * Template Name: Plan My Trip
 *
 * The concierge trip designer as a full page (the same form also opens as a popup).
 *
 * @package Suntourz\Theme
 */

use function Suntourz\Theme\render_mount;

defined( 'ABSPATH' ) || exit;

get_header();

ob_start();
?>
<main>
	<h1><?php the_title(); ?></h1>
	<p><?php esc_html_e( 'Tell us how you want to travel and a Thailand specialist will design your journey. JavaScript is required for the interactive trip designer — you can also contact us directly.', 'suntourz' ); ?></p>
</main>
<?php
render_mount( 'PlanMyTrip', (string) ob_get_clean() );

get_footer();
