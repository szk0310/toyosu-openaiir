$(function () {
    var windowWidth = window.innerWidth;
    /*--------------------------------
      smoothscroll
	 ---------------------------------*/
    $('a[href^="#"]').click(function () {
        var speed = 700;
        var href = $(this).attr("href");
        var target = $(href === "#" || href === "" ? 'html' : href);
        if (windowWidth > 768) {
            var position = target.offset().top;
        } else {
            position = target.offset().top;
        }
        $("html, body").animate({
            scrollTop: position
        }, speed, "swing");
        return false;
    });
    

});	


