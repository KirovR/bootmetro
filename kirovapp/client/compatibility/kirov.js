$(document).ready(function(){
      $('.panorama').panorama({
         //nicescroll: false,
         showscrollbuttons: true,
         keyboard: true,
         parallax: true
      });

//      $(".panorama").perfectScrollbar();

      $('#pivot').pivot();

           // set up hover panels
           // although this can be done without JavaScript, we've attached these events
          // because it causes the hover to be triggered when the element is tapped on a touch device
        $('.hover').hover(function(){
            $(this).addClass('flip');
        },function(){
            $(this).removeClass('flip');
        });

	window.oncontextmenu = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
	};
	


});