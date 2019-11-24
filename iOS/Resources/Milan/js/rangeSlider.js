$(document).ready(function () {
    /* -6 sono i px di scarto dei lati dello sfondo "range.png" */
    var distanzaSinistra = ($('.ui-slider-handle').offset().left - 6) + "px";

    $(".ui-slider-popup").css("left", distanzaSinistra);
});