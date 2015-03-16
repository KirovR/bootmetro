$(document).ready(function(){
      $('.panorama').panorama({
         //nicescroll: false,
         showscrollbuttons: true,
         keyboard: true,
         parallax: true,
		 mousewheel : false
      });

//      $(".panorama").perfectScrollbar();

      $('#pivot').pivot();

        //   // set up hover panels
        //   // although this can be done without JavaScript, we've attached these events
        //  // because it causes the hover to be triggered when the element is tapped on a touch device
        //$('.hover').hover(function(){
        //    $(this).addClass('flip');
        //},function(){
        //    $(this).removeClass('flip');
        //});

    //prevent right click code
	window.oncontextmenu = function(event) {
        event.preventDefault();
        event.stopPropagation();
        return false;
	};

    //live resize code
    $("#tile-listview-demo").css("height", $(window).height()-200);
    var globalTimer = null;
    $(window).resize(function() {
        clearTimeout(globalTimer);
        globalTimer = setTimeout(function(){$("#tile-listview-demo").css("height", $(window).height()-200)}, 500);
    });

    //show code
    var today = new Date();
    var month = today.getMonth();
    if(month == 11 || month == 0){ //only Dec and Jan
        $.fn.snow();
    }

    //web notifications code



});
