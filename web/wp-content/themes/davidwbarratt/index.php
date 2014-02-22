<?php get_header() ?>
	<div id="content" class="prefix_1 grid_14">
		<?php if ( ! have_posts() ) : ?>
			<div id="post-0" class="post error404 not-found">
				<h2 class="entry-title"><?php _e( 'Not Found', 'davidwbarratt' ); ?></h2>
				<div class="entry-content">
					<p><?php _e( 'ooops... what you were looking for cannot be found...', 'davidwbarratt' ); ?></p>
				</div>
			</div>
		<?php endif; ?>
		<?php while ( have_posts() ) : the_post(); ?>
			<div id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
				<h2 class="entry-title"><a href="<?php the_permalink(); ?>" title="<?php the_title(); ?>" ><?php the_title(); ?></a></h2>
				<div class="hr"></div>
				<div class="post-meta">
					<div class="post-date">
						<?php print get_the_date('F j Y'); ?> at <?php print get_the_date('g:ia'); ?>
					</div>
				</div>
				<?php if ( is_archive() || is_search() || is_tag()) : ?>
					<div class="entry-summary">
						<?php the_excerpt(); ?>
					</div>
				<?php else : ?>
				<div class="entry-content">
					<?php the_content( __( 'Continue reading <span class="meta-nav">&rarr;</span>', 'davidwbarratt' ) ); ?>
				</div>
				<?php endif; ?>
				<h4 class="comments-title"><a href="<?php the_permalink(); ?>#comments"><?php print get_comments_number(); ?> Comments</a></h4>
			</div>
		<?php endwhile; ?>
		<?php if ( $wp_query->max_num_pages > 1 ) : ?>
			<div id="nav-above" class="navigation">
				<div class="nav-previous"><?php next_posts_link( __( '<span class="meta-nav">&larr;</span> Older posts', 'davidwbarratt' ) ); ?></div>
				<div class="nav-next"><?php previous_posts_link( __( 'Newer posts <span class="meta-nav">&rarr;</span>', 'davidwbarratt' ) ); ?></div>
			</div>
		<?php endif; ?>
	</div>
<?php get_footer() ?>