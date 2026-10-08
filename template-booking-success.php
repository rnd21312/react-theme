<?php
/**
 * Template Name: Booking success
 *
 * Shown after a booking request. React reads ?code= and the guest's e-mail (kept in sessionStorage).
 *
 * @package Suntourz\Theme
 */

use function Suntourz\Theme\render_mount;

defined( 'ABSPATH' ) || exit;

get_header();

ob_start();
?>
<main>
	<h1><?php esc_html_e( 'Thank you — your booking request was received', 'suntourz' ); ?></h1>
	<p><?php esc_html_e( 'We will contact you shortly to confirm your seats and arrange payment.', 'suntourz' ); ?></p>
</main>
<?php
render_mount( 'BookingSuccess', (string) ob_get_clean() );

get_footer();
