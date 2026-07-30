$(function () {

    /* ========================================
       ブレイクポイント
    ======================================== */
    const mq = window.matchMedia('(max-width:767px)');
    const is_pc = '(min-width:768px)';
    const is_sp = '(max-width:767px)';

    const $menuTrigger = $('.sp-menu-trigger');
    const $gnav = $('.gnav-wrap');
    const $dropdown = $('.dropdown');
    const $dropdownToggle = $('.dropdown-toggle');
    const $main = $('.main');


    /* ========================================
       PC・SPで画像切り替え (IE)
    ======================================== */
    const $set_elem = $('.is-imgswitch');
    const pc_name = '_pc';
    const sp_name = '_sp';

    const userAgent = window.navigator.userAgent.toLowerCase();

    if (userAgent.indexOf('msie') !== -1 || userAgent.indexOf('trident') !== -1) {

        $set_elem.each(function () {

            const $this = $(this);

            function img_size() {
                if (window.matchMedia(is_pc).matches) {
                    $this.attr('src', $this.attr('src').replace(sp_name, pc_name));
                } else {
                    $this.attr('src', $this.attr('src').replace(pc_name, sp_name));
                }
            }

            $(window).on('resize', img_size);
            img_size();
        });
    }


    /* ========================================
       smoothscroll
    ======================================== */
    const headerHeight = $('header').innerHeight() - 1;

    $('a[href^="#"]').on('click', function () {

        const speed = 700;
        const href = $(this).attr("href");
        const $target = (href === "#" || href === "") ? $('html') : $(href);

        const position = $target.offset().top - headerHeight;

        $('html, body').animate({
            scrollTop: position
        }, speed, "swing");

        return false;
    });


    /* ========================================
       pagetop
    ======================================== */
    const $pagetop = $('.pagetop').hide();

    $(window).on('scroll', function () {
        if ($(this).scrollTop() > 100) {
            $pagetop.fadeIn();
        } else {
            $pagetop.fadeOut();
        }
    });


    /* ========================================
       SP MENU
    ======================================== */
    $menuTrigger.on('click', function () {

        $(this).toggleClass('is-open');

        if ($(this).hasClass('is-open')) {
            $gnav.stop(true, true).slideDown();
        } else {
            $gnav.stop(true, true).slideUp();

            if (mq.matches) {
                $dropdown.stop(true, true).slideUp(0);
            }
        }
    });


    /* ========================================
       SP DROPDOWN ACCORDION
    ======================================== */
    $dropdownToggle.on('click', function (e) {

        if (!mq.matches) return;

        e.preventDefault();

        const $target = $(this).next('.dropdown');

        $dropdown.not($target).stop(true, true).slideUp();
        $target.stop(true, true).slideToggle();
    });


    /* ========================================
       RESIZE CONTROL（ここが重要）
    ======================================== */
    function handleResize(e) {

        const headerHeight = $('header').innerHeight();
        $main.css('padding-top', headerHeight);

        if (e.matches) {
            // SP
            $gnav.hide();

        } else {
            // PC

            $menuTrigger.removeClass('is-open');
            $gnav.show();

            // dropdown完全リセット（inline style削除）
            $dropdown
                .stop(true, true)
                .removeAttr('style');
        }
    }

    handleResize(mq);
    mq.addEventListener('change', handleResize);

});