$(function() {
  var $form = $('#form');
  $('#searchGoogleBtn').on('click', function(e) {
    console.log('Button Clicked');
    var $btn = $(this);
    var btnTxt = $btn.text();
    var loadingGif = new Image();
    loadingGif.src = '/images/ajax-loader.gif';
    $btn.html(loadingGif);
    e.preventDefault();
    $.ajax({
      url: '/search',
      context: $form
    }).done(function(data) {
      if(data.success && data.question !== ''){
        console.log('Server Response Came');
        $('#searchInput').val(data.question);
        this.off("submit");
        this.submit();
        $btn.html(btnTxt);
      }
    });
  });
});
