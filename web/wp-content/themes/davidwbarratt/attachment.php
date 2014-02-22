<?php get_header() ?>
	<div id="content" class="single-attachment prefix_1 grid_14">
		<?php while ( have_posts() ) : the_post(); ?>
			<div id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
				<h2 class="entry-title"><a href="<?php print get_permalink($post->post_parent); ?>">&lt;- <?php print get_the_title($post->post_parent); ?></a></h2>
				<h2 class="attachment-title"><?php the_title(); ?></h2>
				<div class="clear"></div>
				<div class="hr"></div>
				<div class="post-meta">
					<div class="post-date">
						<?php print get_the_date('F j Y'); ?> at <?php print get_the_date('g:ia'); ?>
					</div>
					<?php include('share.php'); ?>
				</div>
				<div class="entry-content">
				<?php if ( wp_attachment_is_image() ) :
				$attachments = array_values( get_children( array( 'post_parent' => $post->post_parent, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => 'ASC', 'orderby' => 'menu_order ID' ) ) );
				foreach ( $attachments as $k => $attachment ) {
					if ( $attachment->ID == $post->ID )
						break;
				}
				$k++;
				// If there is more than 1 image attachment in a gallery
				if ( count( $attachments ) > 1 ) {
					if ( isset( $attachments[ $k ] ) )
						// get the URL of the next image attachment
						$next_attachment_url = get_attachment_link( $attachments[ $k ]->ID );
					else
						// or get the URL of the first image attachment
						$next_attachment_url = get_attachment_link( $attachments[ 0 ]->ID );
				} else {
					// or, if there's only 1 image attachment, get the URL of the image
					$next_attachment_url = wp_get_attachment_url();
				}
			?>
			
					<p class="attachment"><a href="<?php echo $next_attachment_url; ?>" title="<?php echo esc_attr( get_the_title() ); ?>" rel="attachment"><?php
							$attachment_size = apply_filters( 'davidwbarratt_attachment_size', 820 );
							echo wp_get_attachment_image( $post->ID, array( $attachment_size, 9999 ) ); // filterable image width with, essentially, no limit for image height.
						?></a></p>
						<?php the_content( __( 'Continue reading <span class="meta-nav">&rarr;</span>', 'davidwbarratt' ) ); ?>

						<div id="nav-below" class="navigation">
							<div class="nav-previous"><?php previous_image_link('', 'Previous'); ?></div>
							<div class="nav-next"><?php next_image_link('', 'Next'); ?></div>
						</div><!-- #nav-below -->
						<div class="clear"></div>
<?php else : ?>
						<a href="<?php echo wp_get_attachment_url(); ?>" title="<?php echo esc_attr( get_the_title() ); ?>" rel="attachment"><?php echo basename( get_permalink() ); ?></a>
<?php endif; ?>
					<?php edit_post_link( __( 'Edit', 'davidwbarratt' ), '<span class="edit-link">', '</span>' ); ?>
				</div>
				<?php comments_template( '', true ); ?>
				<p><?php the_tags(); ?></p>
			</div>
		<?php endwhile; ?>
	</div>
<?php get_footer() ?>