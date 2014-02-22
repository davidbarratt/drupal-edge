<?php get_header() ?>
	<div id="content" class="prefix_1 grid_14">
		<?php while ( have_posts() ) : the_post(); ?>
			<div id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
				<h2 class="entry-title"><?php the_title(); ?></h2>
				<div class="hr"></div>
				<div class="post-meta">
					<div class="post-date">
						<?php print get_the_date('F j Y'); ?> at <?php print get_the_date('g:ia'); ?>
					</div>
				</div>
				<div class="entry-content">
					<?php the_content( __( 'Continue reading <span class="meta-nav">&rarr;</span>', 'davidwbarratt' ) ); ?>
					<?php edit_post_link( __( 'Edit', 'davidwbarratt' ), '<span class="edit-link">', '</span>' ); ?>
				</div>
				<?php comments_template( '', true ); ?>
				<p><?php the_tags(); ?></p>
			</div>
		<?php endwhile; ?>
	</div>
<?php get_footer() ?>