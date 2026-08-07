/* Trovi AI restaurant mobile layout v13. Desktop remains untouched. */
(function(){
  if(!window.matchMedia('(max-width: 720px)').matches) return;
  var copy=document.querySelector('.restaurant-page .rr-hero-copy');
  var demo=document.querySelector('.restaurant-page .rr-live-demo');
  var intro=copy && copy.querySelector(':scope > p');
  if(copy && demo && intro){
    intro.insertAdjacentElement('afterend',demo);
  }
})();
