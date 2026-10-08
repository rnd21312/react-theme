<?php
/**
 * Editable SEO: a title / description / share image / "hide from Google" box on every page, article, tour,
 * destination, travel style and category, plus site-level values for the home, tours and blog pages
 * (Suntourz → Settings → Home content → Seo).
 *
 * @package Suntourz\Theme
 */

declare(strict_types=1);

namespace Suntourz\Theme;

defined( 'ABSPATH' ) || exit;

const SEO_POST_TYPES = array( 'post', 'page', 'stz_tour' );
const SEO_TAXONOMIES = array( 'stz_destination', 'stz_style', 'category', 'post_tag' );
const SEO_KEYS       = array( 'title', 'description', 'image', 'noindex' );

/**
 * The owner's SEO values for the current request (empty strings / false when nothing is set).
 *
 * @return array{title: string, description: string, image: string, noindex: bool}
 */
function seo_override(): array {
	$out = array(
		'title'       => '',
		'description' => '',
		'image'       => '',
		'noindex'     => false,
	);

	$seo = (array) ( brand_content()['seo'] ?? array() );

	if ( is_front_page() ) {
		$out['title']       = (string) ( $seo['home_title'] ?? '' );
		$out['description'] = (string) ( $seo['home_description'] ?? '' );
	} elseif ( is_post_type_archive( 'stz_tour' ) ) {
		$out['title']       = (string) ( $seo['tours_title'] ?? '' );
		$out['description'] = (string) ( $seo['tours_description'] ?? '' );
	} elseif ( is_home() ) {
		$out['title']       = (string) ( $seo['blog_title'] ?? '' );
		$out['description'] = (string) ( $seo['blog_description'] ?? '' );
	}

	$meta = static function ( callable $read ) use ( &$out ): void {
		foreach ( SEO_KEYS as $key ) {
			$value = $read( '_stz_seo_' . $key );
			if ( 'noindex' === $key ) {
				$out['noindex'] = $out['noindex'] || '1' === (string) $value;
			} elseif ( '' !== trim( (string) $value ) ) {
				$out[ $key ] = trim( (string) $value );
			}
		}
	};

	if ( is_singular() ) {
		$id = (int) get_queried_object_id();
		$meta( static fn ( string $key ) => get_post_meta( $id, $key, true ) );
	} elseif ( is_tax() || is_category() || is_tag() ) {
		$term = get_queried_object();
		if ( $term instanceof \WP_Term ) {
			$meta( static fn ( string $key ) => get_term_meta( $term->term_id, $key, true ) );
		}
	}

	if ( '' === $out['image'] ) {
		$out['image'] = (string) ( $seo['default_image'] ?? '' );
	}

	/**
	 * Lets other code (the visual editor) override the page's SEO fields.
	 *
	 * @param array{title: string, description: string, image: string, noindex: bool} $out Fields.
	 */
	return (array) apply_filters( 'stz_seo_override', $out );
}

/**
 * Field markup shared by the post box and the term screens.
 *
 * @param callable $read Reads a stored value by meta key.
 */
function seo_fields_html( callable $read, bool $table ): void {
	$fields = array(
		'title'       => array( __( 'SEO title', 'suntourz' ), 'text', __( 'Shown in the browser tab and on Google. About 50–60 characters. Empty = automatic.', 'suntourz' ) ),
		'description' => array( __( 'Meta description', 'suntourz' ), 'textarea', __( 'The snippet under the title on Google. About 140–160 characters. Empty = automatic.', 'suntourz' ) ),
		'image'       => array( __( 'Share image URL', 'suntourz' ), 'image', __( 'Picture used when the page is shared on social networks. Empty = featured image.', 'suntourz' ) ),
	);

	foreach ( $fields as $key => $field ) {
		$name  = 'stz_seo[' . $key . ']';
		$value = (string) $read( '_stz_seo_' . $key );
		$id    = 'stz-seo-' . $key;

		echo $table ? '<tr class="form-field"><th scope="row">' : '<p>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		printf( '<label for="%s"><strong>%s</strong></label>', esc_attr( $id ), esc_html( $field[0] ) );
		echo $table ? '</th><td>' : '<br>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		if ( 'textarea' === $field[1] ) {
			printf( '<textarea id="%s" name="%s" rows="3" class="large-text">%s</textarea>', esc_attr( $id ), esc_attr( $name ), esc_textarea( $value ) );
		} else {
			printf( '<input type="text" id="%s" name="%s" value="%s" class="large-text">', esc_attr( $id ), esc_attr( $name ), esc_attr( $value ) );
			if ( 'image' === $field[1] ) {
				printf( ' <button type="button" class="button stz-seo-pick" data-target="%s">%s</button>', esc_attr( $id ), esc_html__( 'Choose image', 'suntourz' ) );
			}
		}
		printf( '<span class="description" style="display:block">%s</span>', esc_html( $field[2] ) );
		echo $table ? '</td></tr>' : '</p>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	$checked = '1' === (string) $read( '_stz_seo_noindex' );
	echo $table ? '<tr class="form-field"><th scope="row"></th><td>' : '<p>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	printf( '<label><input type="checkbox" name="stz_seo[noindex]" value="1" %s> %s</label>', checked( $checked, true, false ), esc_html__( 'Hide this page from search engines (noindex)', 'suntourz' ) );
	echo $table ? '</td></tr>' : '</p>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

/**
 * @param array<string, mixed> $input Raw $_POST['stz_seo'].
 * @return array<string, string>
 */
function seo_clean( array $input ): array {
	return array(
		'title'       => mb_substr( sanitize_text_field( (string) ( $input['title'] ?? '' ) ), 0, 120 ),
		'description' => mb_substr( sanitize_textarea_field( (string) ( $input['description'] ?? '' ) ), 0, 320 ),
		'image'       => esc_url_raw( (string) ( $input['image'] ?? '' ) ),
		'noindex'     => ! empty( $input['noindex'] ) ? '1' : '',
	);
}

/** Small media-library picker for the "share image" fields. */
function seo_picker_script(): void {
	wp_enqueue_media();
	wp_add_inline_script(
		'media-editor',
		"document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.stz-seo-pick');if(!b)return;e.preventDefault();var f=wp.media({library:{type:'image'},multiple:false});f.on('select',function(){document.getElementById(b.dataset.target).value=f.state().get('selection').first().toJSON().url;});f.open();});"
	);
}

/* ------------------------------------------------------------------ Posts, pages, tours */

add_action(
	'add_meta_boxes',
	static function (): void {
		foreach ( SEO_POST_TYPES as $type ) {
			add_meta_box(
				'stz-seo',
				__( 'Search engine & sharing (SEO)', 'suntourz' ),
				static function ( \WP_Post $post ): void {
					wp_nonce_field( 'stz_seo_save', 'stz_seo_nonce' );
					seo_fields_html( static fn ( string $key ) => get_post_meta( $post->ID, $key, true ), false );
				},
				$type,
				'normal',
				'low'
			);
		}
	}
);

add_action(
	'admin_enqueue_scripts',
	static function ( string $hook ): void {
		if ( in_array( $hook, array( 'post.php', 'post-new.php', 'term.php', 'edit-tags.php' ), true ) ) {
			seo_picker_script();
		}
	}
);

add_action(
	'save_post',
	static function ( int $post_id ): void {
		if ( ! isset( $_POST['stz_seo_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( (string) $_POST['stz_seo_nonce'] ) ), 'stz_seo_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$input = isset( $_POST['stz_seo'] ) && is_array( $_POST['stz_seo'] ) ? wp_unslash( $_POST['stz_seo'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- cleaned in seo_clean().
		foreach ( seo_clean( $input ) as $key => $value ) {
			if ( '' === $value ) {
				delete_post_meta( $post_id, '_stz_seo_' . $key );
			} else {
				update_post_meta( $post_id, '_stz_seo_' . $key, $value );
			}
		}
	}
);

/* ------------------------------------------------------------------ Terms */

add_action(
	'init',
	static function (): void {
		foreach ( SEO_TAXONOMIES as $taxonomy ) {
			add_action(
				$taxonomy . '_add_form_fields',
				static function (): void {
					echo '<h3>' . esc_html__( 'Search engine & sharing (SEO)', 'suntourz' ) . '</h3>';
					wp_nonce_field( 'stz_seo_term', 'stz_seo_term_nonce' );
					seo_fields_html( static fn () => '', false );
				}
			);
			add_action(
				$taxonomy . '_edit_form_fields',
				static function ( \WP_Term $term ): void {
					echo '<tr class="form-field"><th colspan="2"><h3>' . esc_html__( 'Search engine & sharing (SEO)', 'suntourz' ) . '</h3></th></tr>';
					wp_nonce_field( 'stz_seo_term', 'stz_seo_term_nonce' );
					seo_fields_html( static fn ( string $key ) => get_term_meta( $term->term_id, $key, true ), true );
				}
			);
			$save = static function ( int $term_id ): void {
				if ( ! isset( $_POST['stz_seo_term_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( (string) $_POST['stz_seo_term_nonce'] ) ), 'stz_seo_term' ) ) {
					return;
				}
				if ( ! current_user_can( 'manage_categories' ) ) {
					return;
				}

				$input = isset( $_POST['stz_seo'] ) && is_array( $_POST['stz_seo'] ) ? wp_unslash( $_POST['stz_seo'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- cleaned in seo_clean().
				foreach ( seo_clean( $input ) as $key => $value ) {
					if ( '' === $value ) {
						delete_term_meta( $term_id, '_stz_seo_' . $key );
					} else {
						update_term_meta( $term_id, '_stz_seo_' . $key, $value );
					}
				}
			};
			add_action( 'created_' . $taxonomy, $save );
			add_action( 'edited_' . $taxonomy, $save );
		}
	},
	20
);
