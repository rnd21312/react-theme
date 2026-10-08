<?php
/**
 * Document head. The visible header/footer are rendered by React (Layout).
 *
 * @package Suntourz\Theme
 */

use function Suntourz\Theme\brand_content;

defined( 'ABSPATH' ) || exit;
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'bg-cream text-ink antialiased' ); ?>>
<?php wp_body_open(); ?>
<?php $stz_logo = (string) ( ( (array) ( brand_content()['brand'] ?? array() ) )['logo_image'] ?? '' ); ?>
<div class="stz-splash" id="stz-splash" aria-hidden="true">
	<?php if ( '' !== $stz_logo ) : ?>
		<img src="<?php echo esc_url( $stz_logo ); ?>" alt="" style="max-height:64px;max-width:220px;width:auto;height:auto">
	<?php else : ?>
		<div class="stz-splash__mark">
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/></svg>
		</div>
		<div class="stz-splash__name"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></div>
	<?php endif; ?>
	<div class="stz-splash__bar"></div>
</div>
