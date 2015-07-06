function UI() {
    this.busy = function() {
        $("#wait").stop(true, true);
        $("#content").stop(true, true);     // stop all animations on content element

        $("#content").fadeOut();    // fade out content
        $("#wait").fadeIn(100);     // show wait cursor
    };

    this.ready = function() {
        $("#wait").stop(true, true);
        $("#content").stop(true, true);     // stop all animations on content element

        $("#content").fadeIn(100);    // fade out content
        $("#wait").fadeOut();     // show wait cursor
    };
}



