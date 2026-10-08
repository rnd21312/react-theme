<?php
/**
 * Enqueues the Vite bundle: manifest-based in production, dev server (HMR) when STZ_VITE_DEV is true.
 *
 * Enable dev mode in wp-config.php:  define( 'STZ_VITE_DEV', true );
 * Optional dev server URL override:  define( 'STZ_VITE_URL', 'http://localhost:5173' );
 *
 * @package Suntourz\Theme
 */

declare(strict_types=1);

namespace Suntourz\Theme;

defined( 'ABSPATH' ) || exit;

const SITE_ENTRY = 'src/site/main.tsx';

function vite_is_dev(): bool {
	return defined( 'STZ_VITE_DEV' ) && STZ_VITE_DEV;
}

function vite_dev_url(): string {
	return rtrim( defined( 'STZ_VITE_URL' ) ? (string) STZ_VITE_URL : 'http://localhost:5173', '/' );
}

/**
 * Parsed dist/.vite/manifest.json (empty array when the bundle is not built).
 *
 * @return array<string, array<string, mixed>>
 */
function vite_manifest(): array {
	static $manifest = null;

	if ( null !== $manifest ) {
		return $manifest;
	}

	$file     = STZ_THEME_DIR . '/dist/.vite/manifest.json';
	$manifest = array();

	if ( is_readable( $file ) ) {
		$decoded = json_decode( (string) file_get_contents( $file ), true );
		if ( is_array( $decoded ) ) {
			$manifest = $decoded;
		}
	}

	return $manifest;
}

function dist_url( string $path ): string {
	return STZ_THEME_URI . '/dist/' . ltrim( $path, '/' );
}

/**
 * Static (eagerly loaded) chunk files imported by an entry, for modulepreload.
 *
 * @param array<string, array<string, mixed>> $manifest Vite manifest.
 * @return string[]
 */
function vite_static_imports( array $manifest, string $key, array &$seen = array() ): array {
	$files = array();

	foreach ( (array) ( $manifest[ $key ]['imports'] ?? array() ) as $import ) {
		if ( isset( $seen[ $import ] ) || ! isset( $manifest[ $import ] ) ) {
			continue;
		}
		$seen[ $import ] = true;
		$files[]         = (string) $manifest[ $import ]['file'];
		$files           = array_merge( $files, vite_static_imports( $manifest, $import, $seen ) );
	}

	return $files;
}

add_action(
	'wp_enqueue_scripts',
	static function (): void {
		if ( vite_is_dev() ) {
			return; // Dev assets are printed in wp_head (see below).
		}

		$manifest = vite_manifest();
		$entry    = $manifest[ SITE_ENTRY ] ?? null;

		if ( null === $entry ) {
			return; // Bundle not built; templates still print their server-rendered fallback.
		}

		foreach ( (array) ( $entry['css'] ?? array() ) as $i => $css ) {
			wp_enqueue_style( 'stz-site-' . $i, dist_url( (string) $css ), array(), STZ_THEME_VERSION );
		}

		// No ?ver= on the entry: lazy page chunks import it by bare URL, and a different URL would
		// make the browser evaluate the entry twice. Hashed filenames already bust the cache.
		wp_enqueue_script_module( 'stz-site', dist_url( (string) $entry['file'] ), array(), null );
	}
);

/**
 * React page the current WordPress request mounts (mirrors the templates' render_mount() calls).
 */
function current_page_name(): string {
	if ( is_front_page() ) {
		return 'Home';
	}
	if ( is_singular( 'stz_tour' ) ) {
		return 'TourSingle';
	}
	if ( is_post_type_archive( 'stz_tour' ) || is_tax( array( 'stz_destination', 'stz_style' ) ) ) {
		return 'ToursArchive';
	}
	if ( is_singular( 'post' ) ) {
		return 'Article';
	}
	if ( is_home() || is_category() || is_tag() || is_search() ) {
		return 'Articles';
	}
	if ( is_page_template( 'template-plan-my-trip.php' ) ) {
		return 'PlanMyTrip';
	}
	if ( is_page_template( 'template-booking-success.php' ) ) {
		return 'BookingSuccess';
	}
	if ( is_page() ) {
		return 'Page';
	}

	return 'NotFound';
}

// First paint: mark JS-capable browsers (the splash + hidden fallback only apply then) and give up after
// a while if the bundle never starts, so the server-rendered content always stays reachable.
add_action(
	'wp_head',
	static function (): void {
		?>
<script>
(function (d) {
	var h = d.documentElement;
	h.classList.add('stz-js');
	try { if (sessionStorage.getItem('stz-seen')) { h.classList.add('stz-warm'); } } catch (e) {}
	setTimeout(function () { if (!h.classList.contains('stz-ready')) { h.classList.remove('stz-js'); } }, 15000);
})(document);
</script>
<style id="stz-critical">
html{background:#faf8f5}
body{margin:0}
.stz-splash{display:none}
.stz-js .stz-splash{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#faf8f5;color:#0e2a23;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;transition:opacity .6s cubic-bezier(.22,1,.36,1),visibility .6s}
.stz-ready .stz-splash{opacity:0;visibility:hidden;pointer-events:none}
.stz-splash__mark{display:flex;height:56px;width:56px;align-items:center;justify-content:center;border-radius:16px;background:#0e2a23;color:#d4af37;animation:stz-pulse 1.8s ease-in-out infinite}
.stz-splash__name{font-size:22px;font-weight:800;letter-spacing:-.02em}
.stz-splash__bar{position:relative;height:2px;width:120px;overflow:hidden;border-radius:2px;background:#e8e2d9}
.stz-splash__bar:after{content:"";position:absolute;inset:0;width:45%;background:#d4af37;animation:stz-slide 1.1s cubic-bezier(.65,0,.35,1) infinite}
.stz-warm .stz-splash{align-items:stretch;justify-content:flex-start;gap:0}
.stz-warm .stz-splash__mark,.stz-warm .stz-splash__name,.stz-warm .stz-splash img{display:none}
.stz-warm .stz-splash__bar{width:100%;height:3px;border-radius:0}
.stz-js #stz-root>main{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@keyframes stz-slide{0%{transform:translateX(-110%)}100%{transform:translateX(260%)}}
@keyframes stz-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@media (prefers-reduced-motion:reduce){.stz-splash__mark,.stz-splash__bar:after{animation:none}}
</style>
		<?php
	},
	0
);

// Preload what the current page needs: its chunk, the shared chunks, the font and (home) the hero image.
add_action(
	'wp_head',
	static function (): void {
		if ( vite_is_dev() ) {
			return;
		}

		$manifest = vite_manifest();
		if ( ! isset( $manifest[ SITE_ENTRY ] ) ) {
			return;
		}

		$files = vite_static_imports( $manifest, SITE_ENTRY );

		$page_key = 'src/site/pages/' . current_page_name() . '.tsx';
		if ( isset( $manifest[ $page_key ] ) ) {
			$files[] = (string) $manifest[ $page_key ]['file'];
			$files   = array_merge( $files, vite_static_imports( $manifest, $page_key ) );
		}

		foreach ( array_unique( $files ) as $file ) {
			printf( '<link rel="modulepreload" href="%s">' . "
", esc_url( dist_url( $file ) ) );
		}

		foreach ( (array) ( $manifest[ SITE_ENTRY ]['assets'] ?? array() ) as $asset ) {
			if ( str_ends_with( (string) $asset, '.woff2' ) && str_contains( (string) $asset, '-latin-wght' ) ) {
				printf( '<link rel="preload" as="font" type="font/woff2" crossorigin href="%s">' . "
", esc_url( dist_url( (string) $asset ) ) );
			}
		}

		if ( is_front_page() ) {
			$services = services();
			$hero     = null === $services ? '' : (string) ( $services->content->all()['hero']['image'] ?? '' );
			if ( '' !== $hero ) {
				// Same widths/sizes as the React <Img>, so the preloaded file is the one the hero uses.
				$srcset = array();
				foreach ( array( 640, 1024, 1600, 2400 ) as $width ) {
					$srcset[] = esc_url( (string) preg_replace( '/([?&])w=\d+/', '${1}w=' . $width, $hero ) ) . ' ' . $width . 'w';
				}
				printf(
					'<link rel="preload" as="image" fetchpriority="high" href="%1$s" imagesrcset="%2$s" imagesizes="100vw">' . "
",
					esc_url( $hero ),
					esc_attr( str_contains( $hero, 'images.unsplash.com' ) ? implode( ', ', $srcset ) : '' )
				);
			}
		}
	},
	1
);

// Dev mode: React Refresh preamble + Vite client + entry served by the dev server.
add_action(
	'wp_head',
	static function (): void {
		if ( ! vite_is_dev() ) {
			return;
		}

		$url = vite_dev_url();
		?>
<script type="module">
import RefreshRuntime from "<?php echo esc_url( $url ); ?>/@react-refresh";
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
</script>
<script type="module" src="<?php echo esc_url( $url ); ?>/@vite/client"></script>
<script type="module" src="<?php echo esc_url( $url . '/' . SITE_ENTRY ); ?>"></script>
		<?php
	},
	2
);
