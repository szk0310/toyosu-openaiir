$(function() {
	$('accordion-trigger').each(function(){
        $(this).on('click', function() {
			$(this).toggleClass('is-open');
			if ($(this).hasClass('is-open')) {
				$(this).next('.accordion-cont').slideDown();
			} else {
				$(this).next('.accordion-cont').slideUp();
			}
        });
	});

});