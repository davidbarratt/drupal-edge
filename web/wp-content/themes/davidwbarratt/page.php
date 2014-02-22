<?php get_header() ?>
<div id="content" class="prefix_1 grid_14">
	<?php if ( have_posts() ) while ( have_posts() ) : the_post(); ?>
		<div id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
			<h2 class="entry-title"><?php the_title(); ?></h2>
				<div class="hr"></div>
				<div class="post-meta">
				</div>
			<div class="entry-content">
				<?php the_content(); ?>
				<?php edit_post_link( __( 'Edit', 'davidwbarratt' ), '<span class="edit-link">', '</span>' ); ?>
			</div>
		</div>
		<?php comments_template( '', true ); ?>
	<?php endwhile; ?>
</div>
<?php get_footer() ?>