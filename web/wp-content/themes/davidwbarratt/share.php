<ul class="share">
	<?php
	$shareurl = 'http://www.facebook.com/sharer.php?u='.urlencode(get_permalink());
	$tweeturl = 'http://twitter.com/share?url='.urlencode(get_permalink()).'&amp;via=davidwbarratt&amp;related=thechur_ch&amp;text='.urlencode(the_title('','',false));
	$tcount = davidwbarratt_twittercount(get_permalink());
	$fcount = davidwbarratt_facebookcount(get_permalink());
	?>
	<li class="shareicon"><a href="javascript:void(0);" onclick="sharepopup('<?php print $tweeturl; ?>', 'Share this on Twitter', 550, 450)">twitter <?php if ($tcount) : ?><span class="count"><?php print $tcount; ?></span><?php endif; ?></a></li>
	<li class="shareicon"><a href="javascript:void(0);" onclick="sharepopup('<?php print $shareurl; ?>', 'Facebook', 550, 450)">facebook <?php if ($fcount) : ?><span class="count"><?php print $fcount; ?></span><?php endif; ?></a></li>
</ul>