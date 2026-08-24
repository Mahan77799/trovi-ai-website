/* Homepage-only mobile demo deck. Desktop markup and desktop carousel are untouched. */
(function(){
  var mq = window.matchMedia('(max-width: 720px)');
  if (!mq.matches) return;

  var copy = document.querySelector('.trovi-home-copy');
  var count = document.querySelector('.trovi-home-count');
  var sourceCards = Array.prototype.slice.call(document.querySelectorAll('.trovi-demo-panel [data-signal-card]'));
  if (!copy || !count || !sourceCards.length) return;

  var root = document.createElement('section');
  root.className = 'mobile-demo-v8';
  root.setAttribute('aria-label', 'Industry voice demos');
  root.innerHTML = '<div class="mobile-demo-v8__viewport"><div class="mobile-demo-v8__track"></div></div>' +
    '<div class="mobile-demo-v8__controls">' +
      '<button class="mobile-demo-v8__arrow mobile-demo-v8__prev" type="button" aria-label="Previous demo">‹</button>' +
      '<div class="mobile-demo-v8__dots" aria-hidden="true"></div>' +
      '<button class="mobile-demo-v8__arrow mobile-demo-v8__next" type="button" aria-label="Next demo">›</button>' +
    '</div>';

  var track = root.querySelector('.mobile-demo-v8__track');
  var dots = root.querySelector('.mobile-demo-v8__dots');
  var page = 0;

  sourceCards.forEach(function(card, index){
    var item = document.createElement('div');
    item.className = 'mobile-demo-v8__item';
    var clone = card.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.remove('is-word-active', 'playing');
    item.appendChild(clone);
    track.appendChild(item);

    var dot = document.createElement('i');
    if (index === 0) dot.className = 'active';
    dots.appendChild(dot);

    clone.addEventListener('click', function(){
      var phone = (clone.getAttribute('data-phone') || '').trim();
      if (phone){
        window.location.href = 'tel:' + phone.replace(/[^+\d]/g, '');
      }
    });
  });

  function render(){
    track.style.transform = 'translateX(-' + (page * 100) + '%)';
    Array.prototype.forEach.call(dots.children, function(dot, index){
      dot.classList.toggle('active', index === page);
    });
  }

  root.querySelector('.mobile-demo-v8__prev').addEventListener('click', function(){
    page = (page - 1 + sourceCards.length) % sourceCards.length;
    render();
  });

  root.querySelector('.mobile-demo-v8__next').addEventListener('click', function(){
    page = (page + 1) % sourceCards.length;
    render();
  });

  var startX = 0;
  root.querySelector('.mobile-demo-v8__viewport').addEventListener('touchstart', function(e){
    startX = e.touches[0].clientX;
  }, {passive:true});
  root.querySelector('.mobile-demo-v8__viewport').addEventListener('touchend', function(e){
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) < 45) return;
    page = dx < 0 ? (page + 1) % sourceCards.length : (page - 1 + sourceCards.length) % sourceCards.length;
    render();
  }, {passive:true});

  copy.insertBefore(root, count);
  render();
})();
