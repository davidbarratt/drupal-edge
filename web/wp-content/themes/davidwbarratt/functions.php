<?php

if ( ! isset( $content_width ) )
$content_width = 820;

// This theme uses post thumbnails
add_theme_support( 'post-thumbnails' );

// Add default posts and comments RSS feed links to head
add_theme_support( 'automatic-feed-links' );

// Reister the Menus
register_nav_menus( array(
	'primary' => __( 'Primary Navigation', 'davidwbaratt' ),
) );

register_nav_menus( array(
	'connect' => __( 'Social Connect', 'davidwbaratt' ),
) );

// Create the Custom Background
add_custom_background();


// Create the Custom Header
define( 'HEADER_TEXTCOLOR', '' );
define( 'HEADER_IMAGE', '%s/img/header.png' );
define( 'HEADER_IMAGE_WIDTH', 304);
define( 'HEADER_IMAGE_HEIGHT', 36);
define( 'NO_HEADER_TEXT', true );
add_custom_image_header('','davidwbarratt_admin_header_style');

// Required Header Style
function davidwbarratt_admin_header_style() {
?>
<style type="text/css">
#headimg {
	border-bottom: 1px solid #000;
	border-top: 4px solid #000;
}
</style>
<?php
}

// Register the Sidebar
register_sidebar( array(
	'name' => __( 'Widget Top', 'davidwbarratt' ),
	'id' => 'top',
) );

// Remove the Gallery CSS
function davidwbarratt_remove_gallery_css( $css ) {
	return preg_replace( "#<style type='text/css'>(.*?)</style>#s", '', $css );
}
add_filter( 'gallery_style', 'davidwbarratt_remove_gallery_css' );

function davidwbarratt_excerpt_length( $length ) {
	return 100;
}
add_filter( 'excerpt_length', 'davidwbarratt_excerpt_length');

function davidwbarratt_excerpt_more( $more ) {
	return '... <a class="read-more" href="'. get_permalink( get_the_ID() ) . '">Read More</a>';
}
add_filter( 'excerpt_more', 'davidwbarratt_excerpt_more' );
