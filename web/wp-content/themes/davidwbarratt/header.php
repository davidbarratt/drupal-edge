<!DOCTYPE HTML>
<html <?php language_attributes(); ?>>
	<head>
		<meta http-equiv="Content-Type" content="<?php bloginfo('html_type'); ?>; charset=<?php bloginfo('charset'); ?>" />
		<title><?php bloginfo('name'); ?> <?php wp_title(); ?></title>
		<script type="text/javascript" src="<?php bloginfo('template_directory'); ?>/js/jquery-1.4.2.min.js"></script>
		<link rel="stylesheet" href="<?php bloginfo('stylesheet_url'); ?>" type="text/css" media="screen" />
		<?php wp_head(); ?>
		<?php $description = ''; ?>
		<?php if (is_single()) { ?>
			<?php while ( have_posts() ) : the_post(); ?>
			<?php
			  
			  $post = get_post();
			  $description = wp_strip_all_tags($post->post_excerp);
			  
			  if (has_post_thumbnail()) { 
				$getimage = wp_get_attachment_image_src(get_post_thumbnail_id(), 'full');
				$ogimage = $getimage[0];
			} elseif (is_attachment()) {
				$getimage = wp_get_attachment_image_src('', 'full');
				$ogimage = $getimage[0];
			} else {
				$ogimage = get_bloginfo('template_directory').'/img/background.jpg';
			}
			endwhile;
		} else {
			$ogimage = get_bloginfo('template_directory').'/img/background.jpg';
		} ?>
		<meta name="og:title" content="<?php the_title(); ?>" />
		<meta name="og:type" content="article" />
		<meta name="og:image" content="<?php print $ogimage; ?>" />
		<meta name="og:description" content="<?php echo esc_attr( $description ); ?>" />
		<meta name="og:url" content="<?php the_permalink(); ?>" />
		<meta name="og:site_name" content="<?php bloginfo('name'); ?>" />
		<meta name="fb:admins" content="211800900" />
		<script type="text/javascript">

		  var _gaq = _gaq || [];
		  _gaq.push(['_setAccount', 'UA-1449779-2']);
		  _gaq.push(['_trackPageview']);
		
		  (function() {
		    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
		    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
		    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
		  })();
		  
		 
		  function sharepopup(url, title, w, h) {
		    var left = (screen.width/2)-(w/2);
			var top = (screen.height/2)-(h/2);
			window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
		  }

	</script>
	</head>
	<body <?php body_class(); ?>>
		<div id="container" class="container_16">
			<div id="header" class="prefix_1 grid_14">
				<?php wp_nav_menu(array('depth'=>1,'theme_location'=>'primary')); ?>
				<div id="sitetitle">
					<?php if (get_header_image()) { ?>
					<a href="<?php bloginfo('wpurl') ?>"><img src="<?php header_image(); ?>" alt="<?php bloginfo('name'); ?>" /></a>
					<?php } ?>
				</div>
				<?php wp_nav_menu(array('depth'=>1,'theme_location'=>'connect','menu_class' => 'connect', 'container' => false,)); ?>
			</div>
			<div class="clear"></div>
			<div class="hr grid_16"></div>