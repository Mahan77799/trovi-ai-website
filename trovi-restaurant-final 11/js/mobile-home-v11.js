/* Trovi AI homepage mobile behavior v11. Desktop remains untouched. */
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

  /* Position the decorative gold orb without letting it shift the centered word. */
  var wordLine=document.getElementById('troviWordLine'),word=document.getElementById('troviWord'),wordOrb=document.getElementById('troviWordOrb');
  function placeWordOrb(){if(!wordLine||!word||!wordOrb)return;var line=wordLine.getBoundingClientRect(),w=word.getBoundingClientRect();wordOrb.style.left=(w.right-line.left)+'px';}
  if(wordLine&&word&&wordOrb){placeWordOrb();var mo=new MutationObserver(function(){requestAnimationFrame(placeWordOrb);});mo.observe(word,{childList:true,characterData:true,subtree:true});window.addEventListener('resize',placeWordOrb,{passive:true});}

  /* Stats: one precisely centered card, swipe, arrows/dots, and replay count-up. */
  var grid=document.querySelector('.stat-grid');
  if(grid){
    var oldHint=document.querySelector('.mobile-stat-hint'); if(oldHint) oldHint.remove();
    var cards=Array.prototype.slice.call(grid.querySelectorAll('.stat-card'));
    var controls=document.createElement('div');controls.className='mobile-stat-controls';
    controls.innerHTML='<button class="mobile-stat-arrow mobile-stat-prev" type="button" aria-label="Previous result">‹</button><div class="mobile-stat-dots" aria-hidden="true"></div><button class="mobile-stat-arrow mobile-stat-next" type="button" aria-label="Next result">›</button>';
    grid.parentNode.insertBefore(controls,grid.nextSibling);
    var statDots=controls.querySelector('.mobile-stat-dots'),activeIndex=0,scrollTimer=null;
    cards.forEach(function(card,index){var d=document.createElement('i');if(index===0)d.className='active';statDots.appendChild(d);});

    function animateNum(el){if(!el)return;var value=parseFloat(el.getAttribute('data-value'))||0,prefix=el.getAttribute('data-prefix')||'',suffix=el.getAttribute('data-suffix')||'';var t0=null,dur=1000;function tick(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/dur,1),n=value*(1-Math.pow(1-p,3));el.textContent=prefix+Math.round(n)+suffix;if(p<1)requestAnimationFrame(tick);}el.textContent=prefix+'0'+suffix;requestAnimationFrame(tick);}
    function setActive(index,replay){activeIndex=Math.max(0,Math.min(cards.length-1,index));Array.prototype.forEach.call(statDots.children,function(dot,i){dot.classList.toggle('active',i===activeIndex);});if(replay){cards.forEach(function(c,i){var n=c.querySelector('.stat-num[data-value]');if(!n)return;if(i===activeIndex)animateNum(n);else n.textContent=(n.getAttribute('data-prefix')||'')+'0'+(n.getAttribute('data-suffix')||'');});}}
    function centerCard(index){var card=cards[index];if(!card)return;var left=card.offsetLeft-(grid.clientWidth-card.offsetWidth)/2;grid.scrollTo({left:left,behavior:'smooth'});setActive(index,true);}
    function nearestIndex(){var center=grid.scrollLeft+grid.clientWidth/2,best=0,dist=Infinity;cards.forEach(function(card,i){var c=card.offsetLeft+card.offsetWidth/2,d=Math.abs(c-center);if(d<dist){dist=d;best=i;}});return best;}
    controls.querySelector('.mobile-stat-prev').addEventListener('click',function(){centerCard((activeIndex-1+cards.length)%cards.length);});
    controls.querySelector('.mobile-stat-next').addEventListener('click',function(){centerCard((activeIndex+1)%cards.length);});
    grid.addEventListener('scroll',function(){clearTimeout(scrollTimer);scrollTimer=setTimeout(function(){var next=nearestIndex();if(next!==activeIndex)setActive(next,true);},90);},{passive:true});
    requestAnimationFrame(function(){centerCard(0);});
  }

  /* footer sections collapse into dropdowns */
  Array.prototype.forEach.call(document.querySelectorAll('footer .f-grid > div:not(.f-brand)'),function(group){var h=group.querySelector('h5');if(!h)return;h.setAttribute('role','button');h.setAttribute('tabindex','0');h.setAttribute('aria-expanded','false');function toggle(){var open=!group.classList.contains('is-open');Array.prototype.forEach.call(document.querySelectorAll('footer .f-grid > div:not(.f-brand).is-open'),function(other){if(other!==group){other.classList.remove('is-open');var oh=other.querySelector('h5');if(oh)oh.setAttribute('aria-expanded','false');}});group.classList.toggle('is-open',open);h.setAttribute('aria-expanded',open?'true':'false');}h.addEventListener('click',toggle);h.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});});
})();
