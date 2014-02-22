$("form :text").focus(function() {
	if ($(this).val() == $(this).attr("data-value")) {
		$(this).val('');
	}
})

$("form :text").blur(function() {
	if ($(this).val() == "")  {
		$(this).val($(this).attr("data-value"));
	}
})


$("form").submit(function() {
	$("form :text").each(function() {
	if ($(this).val() == $(this).attr("data-value")) {
		$(this).val('');
	}
	});
});
	    	