(function(){
  'use strict';

  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var liveDemo=document.getElementById('rrLiveDemo');
  var cards=Array.prototype.slice.call(document.querySelectorAll('[data-rr-agent]'));
  var dots=Array.prototype.slice.call(document.querySelectorAll('[data-rr-dot]'));
  var arrows=document.querySelectorAll('[data-rr-carousel]');
  var callButtons=document.querySelectorAll('[data-rr-call]');
  var focusButtons=document.querySelectorAll('[data-rr-demo-focus]');
  var callNote=document.getElementById('rrCallNote');
  var activeIndex=0;
  var rotateTimer=null;

  function normalizeIndex(index){
    if(!cards.length)return 0;
    return (index+cards.length)%cards.length;
  }

  function renderCarousel(index){
    if(!cards.length)return;
    activeIndex=normalizeIndex(index);
    var prev=normalizeIndex(activeIndex-1);
    var next=normalizeIndex(activeIndex+1);

    cards.forEach(function(card,i){
      card.classList.remove('is-active','is-prev','is-next');
      card.setAttribute('aria-hidden',i===activeIndex?'false':'true');
      var callButton=card.querySelector('[data-rr-call]');
      if(callButton)callButton.tabIndex=i===activeIndex?0:-1;
      if(i===activeIndex)card.classList.add('is-active');
      else if(i===prev)card.classList.add('is-prev');
      else if(i===next)card.classList.add('is-next');
    });

    dots.forEach(function(dot,i){
      dot.classList.toggle('is-active',i===activeIndex);
      dot.setAttribute('aria-current',i===activeIndex?'true':'false');
    });
  }

  function stopAutoRotate(){
    if(rotateTimer){window.clearInterval(rotateTimer);rotateTimer=null;}
  }

  function startAutoRotate(){
    stopAutoRotate();
    if(reduce||cards.length<2)return;
    rotateTimer=window.setInterval(function(){renderCarousel(activeIndex+1);},5200);
  }

  arrows.forEach(function(button){
    button.addEventListener('click',function(){
      renderCarousel(activeIndex+(button.getAttribute('data-rr-carousel')==='next'?1:-1));
      startAutoRotate();
    });
  });

  dots.forEach(function(dot){
    dot.addEventListener('click',function(){
      renderCarousel(parseInt(dot.getAttribute('data-rr-dot'),10)||0);
      startAutoRotate();
    });
  });

  cards.forEach(function(card,i){
    card.addEventListener('click',function(event){
      if(event.target.closest('[data-rr-call]'))return;
      renderCarousel(i);
      startAutoRotate();
    });
  });

  if(liveDemo){
    liveDemo.addEventListener('mouseenter',stopAutoRotate);
    liveDemo.addEventListener('mouseleave',startAutoRotate);
    liveDemo.addEventListener('focusin',stopAutoRotate);
    liveDemo.addEventListener('focusout',startAutoRotate);
  }

  function startLiveCall(){
    if(!liveDemo)return;
    var phone=(liveDemo.getAttribute('data-phone')||'').trim();
    if(!phone){
      if(callNote){
        callNote.textContent='The live demo is ready—add your Trovi phone number to connect this button.';
        callNote.classList.add('is-visible');
        window.setTimeout(function(){callNote.classList.remove('is-visible');},4200);
      }
      return;
    }
    var clean=phone.replace(/[^+\d]/g,'');
    if(!clean)return;
    window.location.href='tel:'+clean;
  }

  callButtons.forEach(function(button){
    button.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();startLiveCall();});
  });

  focusButtons.forEach(function(button){
    button.addEventListener('click',function(){
      if(!liveDemo)return;
      liveDemo.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});
      liveDemo.classList.remove('is-highlighted');
      void liveDemo.offsetWidth;
      liveDemo.classList.add('is-highlighted');
    });
  });

  renderCarousel(activeIndex);
  startAutoRotate();

  // Rotating hero word: keeps the layout stable while changing the message.
  var rotatingWord=document.querySelector('[data-rr-rotating-word]');
  if(rotatingWord){
    var rotatingWords=['call','reservation','opportunity','conversation','question'];
    var rotatingIndex=0;
    if(!reduce){
      window.setInterval(function(){
        rotatingWord.classList.add('is-changing');
        window.setTimeout(function(){
          rotatingIndex=(rotatingIndex+1)%rotatingWords.length;
          rotatingWord.textContent=rotatingWords[rotatingIndex];
          rotatingWord.classList.remove('is-changing');
        },260);
      },2800);
    }
  }

  function animateCount(el){
    if(el.dataset.done)return;
    el.dataset.done='1';
    var target=parseInt(el.getAttribute('data-rr-count')||'0',10);
    if(reduce){el.textContent=target;return;}
    var start=null,dur=1100;
    function tick(ts){
      if(!start)start=ts;
      var p=Math.min((ts-start)/dur,1);
      el.textContent=Math.round(target*(1-Math.pow(1-p,3)));
      if(p<1)requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var dashboard=document.querySelector('.rr-dashboard');
  var how=document.querySelector('.rr-how');
  if('IntersectionObserver'in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting)return;
        entry.target.classList.add('is-visible');
        entry.target.querySelectorAll('[data-rr-count]').forEach(animateCount);
        io.unobserve(entry.target);
      });
    },{threshold:.18});
    if(dashboard)io.observe(dashboard);
    if(how)io.observe(how);
  }else{
    if(dashboard){dashboard.classList.add('is-visible');dashboard.querySelectorAll('[data-rr-count]').forEach(animateCount);}
    if(how)how.classList.add('is-visible');
  }
})();
