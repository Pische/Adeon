$(document).ready(function () {
    /* -5 sono i px di scarto dei lati dello sfondo "range.png" */
    var distanzaLeft = ($('.ui-slider-handle').offset().left - 5) + "px";

    $(".ui-slider-popup").css("left", distanzaLeft);
});