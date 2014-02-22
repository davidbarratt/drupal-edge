<div id="comments">
	<?php if ( have_comments() ) : ?>
		<h3 id="comments-title"><?php print get_comments_number(); ?> Comments</h3>
		<ul class="commentlist">
				<?php wp_list_comments(array('avatar_size'       => 50)); ?>
		</ul>
	<?php endif; ?>

	<?php
$fields =  array(
	'author' => '<p><input id="author" name="author" type="text" value="Name*" data-value="Name*" size="30"' . $aria_req . ' /></p>',
	'email'  => '<p><input id="email" name="email" type="text" value="Email*" data-value="Email*"  size="30"' . $aria_req . ' /></p>',
	'url'    => '<p><input id="url" name="url" type="text" value="Website" data-value="Website" size="30" /></p>'
); ?>

<?php comment_form(array('fields' => $fields,
'comment_field' => '<p class="comment-form-comment"><textarea id="comment" name="comment" cols="45" rows="8" aria-required="true"></textarea></p>', 'comment_notes_after'  => '', 'cancel_reply_link'    => __( '<br />cancel reply' ), 'title_reply' => __( 'Comment' ), 'title_reply_to' => __( 'Reply to %s' ),)); ?>
</div>