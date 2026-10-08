<?php
/**
 * Detects the companion plugin and warns when it is missing.
 *
 * @package Suntourz\Theme
 */

declare(strict_types=1);

namespace Suntourz\Theme;

defined( 'ABSPATH' ) || exit;

/**
 * Whether the suntourz-core plugin is loaded.
 */
function core_active(): bool {
	return defined( 'STZ_CORE_VERSION' );
}

add_action(
	'admin_notices',
	static function (): void {
		if ( core_active() || ! current_user_can( 'activate_plugins' ) ) {
			return;
		}

		printf(
			'<div class="notice notice-warning"><p>%s</p></div>',
			esc_html__( 'The Suntourz theme needs the "Suntourz Core" plugin for tours and bookings. Please install and activate it.', 'suntourz' )
		);
	}
);
