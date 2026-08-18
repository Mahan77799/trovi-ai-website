(function(){
  var demoButtons=document.querySelectorAll('[data-industry-demo]');
  demoButtons.forEach(function(btn){
    btn.addEventListener('click',function(){
      var phone=(btn.getAttribute('data-phone')||'').trim();
      var label=btn.getAttribute('data-label')||'Trovi';
      if(phone){
        btn.setAttribute('aria-label','Opening '+label+' live demo line');
        window.location.href='tel:'+phone.replace(/[^+\d]/g,'');
      }
    });
  });
  var mq=window.matchMedia('(max-width: 720px)');
  if(mq.matches){
    document.querySelectorAll('footer .f-grid>div:not(.f-brand)').forEach(function(group){
      var h=group.querySelector('h5'); if(!h)return;
      h.setAttribute('role','button');h.setAttribute('tabindex','0');h.setAttribute('aria-expanded','false');
      function toggle(){var open=!group.classList.contains('is-open');document.querySelectorAll('footer .f-grid>div:not(.f-brand).is-open').forEach(function(other){if(other!==group){other.classList.remove('is-open');var oh=other.querySelector('h5');if(oh)oh.setAttribute('aria-expanded','false');}});group.classList.toggle('is-open',open);h.setAttribute('aria-expanded',open?'true':'false');}
      h.addEventListener('click',toggle);h.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
    });
  }
})();
