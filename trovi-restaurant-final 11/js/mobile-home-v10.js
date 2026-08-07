/* Trovi AI homepage mobile behavior v10. Desktop remains untouched. */
(function(){
  var mq=window.matchMedia('(max-width: 720px)'); if(!mq.matches) return;

  /* one-card demo deck */
  var copy=document.querySelector('.trovi-home-copy');
  var count=document.querySelector('.trovi-home-count');
  var sourceCards=Array.prototype.slice.call(document.querySelectorAll('.trovi-demo-panel [data-signal-card]'));
  if(copy&&count&&sourceCards.length){
    var root=document.createElement('section'); root.className='mobile-demo-v8'; root.setAttribute('aria-label','Industry voice demos');
    root.innerHTML='<div class="mobile-demo-v8__viewport"><div class="mobile-demo-v8__track"></div></div><div class="mobile-demo-v8__controls"><button class="mobile-demo-v8__arrow mobile-demo-v8__prev" type="button" aria-label="Previous demo">‹</button><div class="mobile-demo-v8__dots" aria-hidden="true"></div><button class="mobile-demo-v8__arrow mobile-demo-v8__next" type="button" aria-label="Next demo">›</button></div><a class="mobile-demo-v8__book" href="resources/contact.html">Book a demo</a>';
    var track=root.querySelector('.mobile-demo-v8__track'),dots=root.querySelector('.mobile-demo-v8__dots'),page=0;
    sourceCards.forEach(function(card,index){var item=document.createElement('div');item.className='mobile-demo-v8__item';var clone=card.cloneNode(true);clone.removeAttribute('id');clone.classList.remove('is-word-active','playing');item.appendChild(clone);track.appendChild(item);var dot=document.createElement('i');if(index===0)dot.className='active';dots.appendChild(dot);clone.addEventListener('click',function(){var phone=(clone.getAttribute('data-phone')||'').trim();if(phone)window.location.href='tel:'+phone.replace(/[^+\d]/g,'');});});
    function render(){track.style.transform='translate3d(-'+(page*100)+'%,0,0)';Array.prototype.forEach.call(dots.children,function(dot,index){dot.classList.toggle('active',index===page);});}
    root.querySelector('.mobile-demo-v8__prev').addEventListener('click',function(){page=(page-1+sourceCards.length)%sourceCards.length;render();});
    root.querySelector('.mobile-demo-v8__next').addEventListener('click',function(){page=(page+1)%sourceCards.length;render();});
    var startX=0;root.querySelector('.mobile-demo-v8__viewport').addEventListener('touchstart',function(e){startX=e.touches[0].clientX;},{passive:true});root.querySelector('.mobile-demo-v8__viewport').addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)<40)return;page=dx<0?(page+1)%sourceCards.length:(page-1+sourceCards.length)%sourceCards.length;render();},{passive:true});
    copy.insertBefore(root,count);render();
  }

  /* stats become a swipe carousel and replay count-up for each centered card */
  var grid=document.querySelector('.stat-grid');
  if(grid){
    var hint=document.createElement('span'); hint.className='mobile-stat-hint'; hint.textContent='Swipe to see the next result'; grid.parentNode.insertBefore(hint,grid.nextSibling);
    var cards=Array.prototype.slice.call(grid.querySelectorAll('.stat-card'));
    function animateNum(el){if(!el)return;var value=parseFloat(el.getAttribute('data-value'))||0,prefix=el.getAttribute('data-prefix')||'',suffix=el.getAttribute('data-suffix')||'';el.dataset.done='1';var t0=null,dur=1200;function tick(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/dur,1),n=value*(1-Math.pow(1-p,3));el.textContent=prefix+Math.round(n)+suffix;if(p<1)requestAnimationFrame(tick);}el.textContent=prefix+'0'+suffix;requestAnimationFrame(tick);}
    if('IntersectionObserver' in window){var sio=new IntersectionObserver(function(entries){entries.forEach(function(en){if(en.intersectionRatio<.62)return;cards.forEach(function(c){if(c!==en.target){var n=c.querySelector('.stat-num[data-value]');if(n){delete n.dataset.done;n.textContent=(n.getAttribute('data-prefix')||'')+'0'+(n.getAttribute('data-suffix')||'');}}});var num=en.target.querySelector('.stat-num[data-value]');if(num){delete num.dataset.done;animateNum(num);}});},{root:grid,threshold:[.62,.78]});cards.forEach(function(c){sio.observe(c);});}
  }

  /* footer sections collapse into dropdowns */
  Array.prototype.forEach.call(document.querySelectorAll('footer .f-grid > div:not(.f-brand)'),function(group){var h=group.querySelector('h5');if(!h)return;h.setAttribute('role','button');h.setAttribute('tabindex','0');h.setAttribute('aria-expanded','false');function toggle(){var open=!group.classList.contains('is-open');Array.prototype.forEach.call(document.querySelectorAll('footer .f-grid > div:not(.f-brand).is-open'),function(other){if(other!==group){other.classList.remove('is-open');var oh=other.querySelector('h5');if(oh)oh.setAttribute('aria-expanded','false');}});group.classList.toggle('is-open',open);h.setAttribute('aria-expanded',open?'true':'false');}h.addEventListener('click',toggle);h.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});});
})();
