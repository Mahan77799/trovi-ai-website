/* TROVI AI — main.js (light theme) */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile nav ---------- */
  var burger = document.getElementById('burger'), mnav = document.getElementById('mnav');
  if (burger && mnav) burger.addEventListener('click', function () {
    var open = mnav.classList.toggle('open');
    burger.classList.toggle('on', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* ---------- dropdowns (click for touch) ---------- */
  var dds = document.querySelectorAll('.has-dd');
  dds.forEach(function (li) {
    var btn = li.querySelector(':scope > .nav-link');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var was = li.classList.contains('open');
      dds.forEach(function (o) { o.classList.remove('open'); });
      if (!was) li.classList.add('open');
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-dd')) dds.forEach(function (o) { o.classList.remove('open'); });
  });

  /* ---------- hero typewriter with sliding ball ---------- */
  var tw = document.getElementById('tw');
  if (tw) {
    var words = ['reservation', 'opportunity', 'conversation', 'chat', 'appointment', 'call', 'insight', 'channel'];
    var wi = 0;
    if (reduce) {
      tw.textContent = words[0];
    } else {
      var TYPE = 68, ERASE = 36, HOLD = 1500, GAP = 380;
      var typeLoop = function () {
        var w = words[wi % words.length]; wi++;
        var i = 0;
        var typeChar = function () {
          i++; tw.textContent = w.slice(0, i);
          if (i < w.length) setTimeout(typeChar, TYPE); else setTimeout(eraseStart, HOLD);
        };
        var eraseStart = function () {
          var jj = w.length;
          var eraseChar = function () {
            jj--; tw.textContent = w.slice(0, jj);
            if (jj > 0) setTimeout(eraseChar, ERASE); else setTimeout(typeLoop, GAP);
          };
          eraseChar();
        };
        typeChar();
      };
      typeLoop();
    }
  }

  /* ---------- live counter (seeded from real time so it always grows) ---------- */
  var lc = document.getElementById('liveCount');
  if (lc) {
    var base = parseInt(lc.getAttribute('data-base') || '0', 10);
    var rate = parseInt(lc.getAttribute('data-rate') || '60', 10); // seconds per +1
    var fmt = function (n) { return n.toLocaleString('en-US'); };
    // Remember when this browser first saw the counter, so it starts at `base`,
    // grows +1 every `rate` seconds, and NEVER restarts across reloads.
    var startMs;
    try {
      var stored = window.localStorage.getItem('trovi_calls_since');
      if (stored) { startMs = parseInt(stored, 10); }
      else { startMs = Date.now(); window.localStorage.setItem('trovi_calls_since', String(startMs)); }
    } catch (e) {
      startMs = Date.UTC(2026, 6, 29, 1, 30); // storage blocked (e.g. sandbox): fixed anchor, still only grows
    }
    var current = function () {
      return base + Math.max(0, Math.floor((Date.now() - startMs) / 1000 / rate));
    };
    var val = current();
    lc.textContent = fmt(val);
    if (!reduce) setInterval(function () {
      var v = current();
      if (v !== val) {
        val = v; lc.textContent = fmt(val);
        lc.style.transition = 'none'; lc.style.opacity = '.55';
        setTimeout(function () { lc.style.transition = 'opacity .4s'; lc.style.opacity = '1'; }, 30);
      }
    }, 15000);
  }

  /* ---------- hero demo fan ---------- */
  var fan = document.getElementById('demoFan');
  if (fan) {
    var cards = Array.prototype.slice.call(fan.querySelectorAll('.demo-card'));
    var n = cards.length, active = 0;
    var speak = document.getElementById('demoSpeak');
    var layout = function () {
      cards.forEach(function (c, i) {
        var off = (i - active + n) % n;
        c.classList.remove('pos-front', 'pos-right', 'pos-left', 'pos-hide');
        var cls = off === 0 ? 'pos-front' : (off === 1 ? 'pos-right' : (off === n - 1 ? 'pos-left' : 'pos-hide'));
        c.classList.add(cls);
      });
      if (speak) {
        speak.href = 'tel:' + cards[active].getAttribute('data-tel');
      }
    };
    var go = function (d) { active = (active + d + n) % n; layout(); };
    var p = document.getElementById('demoPrev'), nx = document.getElementById('demoNext');
    if (p) p.addEventListener('click', function () { go(-1); });
    if (nx) nx.addEventListener('click', function () { go(1); });
    // clicking a side card brings it forward
    cards.forEach(function (c, i) {
      c.addEventListener('click', function (e) {
        if (e.target.closest('.play-orb')) return;
        if (i !== active) { active = i; layout(); }
      });
    });
    layout();
  }

  /* ---------- audio players (demo cards + anything with [data-player]) ---------- */
  document.querySelectorAll('[data-player]').forEach(function (host) {
    var src = host.getAttribute('data-audio');
    var btn = host.querySelector('.play-orb, .play');
    var note = host.querySelector('.p-note');
    if (!btn) return;
    var audio = new Audio(); audio.preload = 'none';
    var missing = false;
    var flash = function () { if (!note) return; note.classList.add('show'); setTimeout(function () { note.classList.remove('show'); }, 2200); };
    audio.addEventListener('error', function () { missing = true; host.classList.remove('playing'); flash(); });
    audio.addEventListener('play', function () { host.classList.add('playing'); });
    audio.addEventListener('pause', function () { host.classList.remove('playing'); });
    audio.addEventListener('ended', function () { host.classList.remove('playing'); });
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (missing) { flash(); return; }
      if (!audio.src) audio.src = src;
      if (audio.paused) { var pr = audio.play(); if (pr && pr.catch) pr.catch(function () { missing = true; flash(); }); }
      else audio.pause();
    });
  });

  /* ---------- reveal + stat counters ---------- */
  function runCounter(el) {
    if (el.dataset.done) return; el.dataset.done = '1';
    var value = parseFloat(el.getAttribute('data-value')) || 0;
    var prefix = el.getAttribute('data-prefix') || '', suffix = el.getAttribute('data-suffix') || '';
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10), commas = el.hasAttribute('data-commas');
    var fmt = function (nn) {
      var s = decimals ? nn.toFixed(decimals) : Math.round(nn).toString();
      if (commas) { var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); s = p.join('.'); }
      return prefix + s + suffix;
    };
    if (reduce) { el.textContent = fmt(value); return; }
    var t0 = null, dur = 2500;
    var tick = function (ts) { if (!t0) t0 = ts; var pr = Math.min((ts - t0) / dur, 1); el.textContent = fmt(value * (1 - Math.pow(1 - pr, 3))); if (pr < 1) requestAnimationFrame(tick); };
    el.textContent = fmt(0); requestAnimationFrame(tick);
  }
  var rvs = document.querySelectorAll('.rv'), counters = document.querySelectorAll('.stat-num[data-value]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('vis');
        en.target.querySelectorAll('.stat-num[data-value]').forEach(runCounter);
        io.unobserve(en.target);
      });
    }, { threshold: 0.18 });
    rvs.forEach(function (el) { io.observe(el); });
    counters.forEach(function (el) { if (!el.closest('.rv')) io.observe(el); });
  } else { rvs.forEach(function (el) { el.classList.add('vis'); }); counters.forEach(runCounter); }

  /* ---------- video (band + story) via modal ---------- */
  var modal = document.getElementById('vmodal'), mv = modal ? modal.querySelector('video') : null;
  var closeModal = function () { if (!modal) return; modal.classList.remove('open'); if (mv) { mv.pause(); mv.removeAttribute('src'); mv.load(); } };
  if (modal) {
    modal.addEventListener('click', function (e) { if (e.target === modal || e.target.classList.contains('v-close')) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }
  document.querySelectorAll('[data-video]').forEach(function (host) {
    var note = host.querySelector('.v-note');
    host.addEventListener('click', function () {
      var src = host.getAttribute('data-video');
      if (!modal || !mv) return;
      var probe = document.createElement('video'); probe.preload = 'metadata';
      probe.onerror = function () { if (note) { note.classList.add('show'); setTimeout(function () { note.classList.remove('show'); }, 2200); } };
      probe.onloadedmetadata = function () { mv.src = src; modal.classList.add('open'); mv.play().catch(function () {}); };
      probe.src = src;
    });
  });

  /* ---------- testimonial carousel ---------- */
  var tt = document.getElementById('tcarTrack');
  if (tt) {
    var tc = tt.querySelectorAll('.tcard'), dotsWrap = document.getElementById('tcarDots'), dots = [];
    if (dotsWrap) tc.forEach(function (_, i) {
      var d = document.createElement('button'); d.setAttribute('aria-label', 'Testimonial ' + (i + 1));
      d.addEventListener('click', function () { tt.scrollTo({ left: tc[i].offsetLeft - tt.offsetLeft, behavior: 'smooth' }); });
      dotsWrap.appendChild(d); dots.push(d);
    });
    var step = function () { return tc.length > 1 ? (tc[1].offsetLeft - tc[0].offsetLeft) : tt.clientWidth; };
    var tp = document.getElementById('tcarPrev'), tn = document.getElementById('tcarNext');
    if (tp) tp.addEventListener('click', function () { tt.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (tn) tn.addEventListener('click', function () { tt.scrollBy({ left: step(), behavior: 'smooth' }); });
    var sync = function () { if (!dots.length) return; var idx = Math.round(tt.scrollLeft / step()); idx = Math.max(0, Math.min(tc.length - 1, idx)); dots.forEach(function (d, i) { d.classList.toggle('on', i === idx); }); };
    tt.addEventListener('scroll', function () { requestAnimationFrame(sync); }); sync();
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q'), a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', function () {
      var open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (o) { if (o !== item) { o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = null; } });
      if (open) { item.classList.remove('open'); a.style.maxHeight = null; }
      else { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  /* ---------- year ---------- */
  var yr = document.getElementById('year'); if (yr) yr.textContent = new Date().getFullYear();
})();


/* Final six-planet homepage demo controls */
(function(){
  var audio = document.getElementById('troviDemoAudio');
  var status = document.getElementById('troviDemoStatus');
  var items = Array.prototype.slice.call(document.querySelectorAll('.trovi-demo-item'));
  if (!audio || !items.length) return;

  items.forEach(function(item){
    item.addEventListener('click', function(){
      var src = item.getAttribute('data-audio');
      var label = item.getAttribute('data-label') || 'Demo';
      audio.pause();
      audio.src = src;
      audio.play().then(function(){
        if (status) status.textContent = label + ' demo playing';
      }).catch(function(){
        if (status) status.textContent = 'Add ' + src + ' to enable this demo.';
      });
    });
  });

  var speak = document.getElementById('troviSpeak');
  if (speak) speak.addEventListener('click', function(){ items[0].click(); });
})();


/* =========================================================
   Trovi Signal Deck carousel and audio
   ========================================================= */
(function(){
  var track = document.getElementById('signalTrack');
  var prev = document.getElementById('signalPrev');
  var next = document.getElementById('signalNext');
  var dots = document.querySelectorAll('.signal-dots i');
  var audio = document.getElementById('signalAudio');
  var status = document.getElementById('signalStatus');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-signal-card]'));
  if (!track || !cards.length) return;

  var page = 0;

  function renderPage(){
    track.classList.toggle('show-second', page === 1);
    dots.forEach(function(dot,index){
      dot.classList.toggle('active', index === page);
    });
  }

  if (prev) prev.addEventListener('click', function(){
    page = page === 0 ? 1 : 0;
    renderPage();
  });

  if (next) next.addEventListener('click', function(){
    page = page === 0 ? 1 : 0;
    renderPage();
  });

  cards.forEach(function(card){
    card.addEventListener('click', function(){
      var src = card.getAttribute('data-audio');
      var phone = (card.getAttribute('data-phone') || '').trim();
      var label = card.getAttribute('data-label') || 'Industry';

      cards.forEach(function(other){
        if (other !== card) other.classList.remove('playing');
      });

      /* A real demo number takes priority over prerecorded audio. */
      if (phone){
        var cleanPhone = phone.replace(/[^+\d]/g, '');
        if (status) status.textContent = 'Opening the ' + label + ' live demo line…';
        window.location.href = 'tel:' + cleanPhone;
        return;
      }

      if (!audio) return;

      if (card.classList.contains('playing') && !audio.paused){
        audio.pause();
        card.classList.remove('playing');
        if (status) status.textContent = label + ' demo paused';
        return;
      }

      audio.pause();
      audio.src = src;
      audio.play().then(function(){
        card.classList.add('playing');
        if (status) status.textContent = label + ' demo playing';
      }).catch(function(){
        card.classList.remove('playing');
        if (status) status.textContent = label + ' live demo number is coming soon.';
      });
    });
  });

  if (audio){
    audio.addEventListener('ended', function(){
      cards.forEach(function(card){ card.classList.remove('playing'); });
      if (status) status.textContent = '';
    });
  }

  renderPage();
})();


/* =========================================================
   Trovi moving word orb + dynamic industry accent
   ========================================================= */
(function(){
  var line = document.getElementById('troviWordLine');
  var word = document.getElementById('troviWord');
  var orb = document.getElementById('troviWordOrb');
  var track = document.getElementById('signalTrack');
  var dots = document.querySelectorAll('.signal-dots i');
  var cards = Array.prototype.slice.call(
    document.querySelectorAll('[data-signal-card]')
  );

  if (!line || !word || !orb) return;

  /*
   * Eight changing words, using the six Trovi industry colors.
   * Repeated industries intentionally reuse their matching color.
   */
  var states = [
    {
      word:'call.',
      industry:'Dental Clinics',
      page:0,
      accent:'#83d44f',
      light:'#dff7bd',
      deep:'#4e9e58'
    },
    {
      word:'channel.',
      industry:'Ask Trovi AI Anything',
      page:1,
      accent:'#4bcbbf',
      light:'#c9f5ee',
      deep:'#268f87'
    },
    {
      word:'insight.',
      industry:'Accounting',
      page:0,
      accent:'#a98af5',
      light:'#e5d9ff',
      deep:'#7054ae'
    },
    {
      word:'reservations.',
      industry:'Restaurants',
      page:1,
      accent:'#57a8ff',
      light:'#cfe9ff',
      deep:'#397fbd'
    },
    {
      word:'opportunity.',
      industry:'Auto Shop',
      page:1,
      accent:'#c98a42',
      light:'#ffe1b2',
      deep:'#93602b'
    },
    {
      word:'chat.',
      industry:'Salons',
      page:0,
      accent:'#f37da5',
      light:'#ffd3e1',
      deep:'#bf4f76'
    },
    {
      word:'conversation.',
      industry:'Accounting',
      page:0,
      accent:'#a98af5',
      light:'#e5d9ff',
      deep:'#7054ae'
    },
    {
      word:'appointment.',
      industry:'Salons',
      page:0,
      accent:'#f37da5',
      light:'#ffd3e1',
      deep:'#bf4f76'
    }
  ];

  var currentText = word.textContent.trim();
  var index = states.findIndex(function(state){
    return state.word === currentText;
  });
  if (index < 0) index = 1; // Existing starting word is channel.

  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var pauseTime = 1500;
  var eraseTime = 680;
  var revealTime = 780;
  var gap = 10;

  function wait(ms){
    return new Promise(function(resolve){
      window.setTimeout(resolve, ms);
    });
  }

  function wordWidth(){
    return Math.ceil(word.getBoundingClientRect().width);
  }

  function mobileWordOffset(){
    if (window.matchMedia && window.matchMedia('(max-width: 720px)').matches){
      return Math.max(0, Math.round((line.clientWidth - wordWidth()) / 2));
    }
    return 0;
  }

  function centerMobileWord(){
    var offset = mobileWordOffset();
    word.style.left = offset + 'px';
    orb.style.left = offset + 'px';
    return offset;
  }

  function placeOrbAtWordEnd(){
    centerMobileWord();
    orb.style.transform =
      'translate3d(' + (wordWidth() + gap) + 'px,-45%,0)';
  }

  function applyState(state){
    line.style.setProperty('--word-accent', state.accent);
    line.style.setProperty('--word-accent-light', state.light);
    line.style.setProperty('--word-accent-deep', state.deep);

    document.documentElement.style.setProperty('--active-hero-accent', state.accent);

    cards.forEach(function(card){
      var matches = card.getAttribute('data-label') === state.industry;
      card.classList.toggle('is-word-active', matches);
    });

    /*
     * Keep the matching card visible. Slide 0 contains the first three
     * industries; slide 1 contains Restaurants, Auto Shop and Ask Trovi AI Anything.
     */
    if (track){
      track.classList.toggle('show-second', state.page === 1);
    }

    if (dots.length){
      dots.forEach(function(dot,dotIndex){
        dot.classList.toggle('active', dotIndex === state.page);
      });
    }
  }

  applyState(states[index]);

  if (reducedMotion){
    word.textContent = states[index].word;
    return;
  }

  async function cycle(){
    while (document.body.contains(line)){
      await wait(pauseTime);

      centerMobileWord();
      var currentWidth = wordWidth();

      await Promise.all([
        orb.animate(
          [
            {transform:'translate3d(' + (currentWidth + gap) + 'px,-45%,0)'},
            {transform:'translate3d(0px,-45%,0)'}
          ],
          {
            duration:eraseTime,
            easing:'cubic-bezier(.65,0,.35,1)',
            fill:'forwards'
          }
        ).finished,
        word.animate(
          [
            {clipPath:'inset(0 0 0 0)'},
            {clipPath:'inset(0 100% 0 0)'}
          ],
          {
            duration:eraseTime,
            easing:'cubic-bezier(.65,0,.35,1)',
            fill:'forwards'
          }
        ).finished
      ]);

      index = (index + 1) % states.length;
      var nextState = states[index];

      word.textContent = nextState.word;
      word.style.clipPath = 'inset(0 100% 0 0)';
      applyState(nextState);

      await new Promise(function(resolve){
        requestAnimationFrame(function(){
          requestAnimationFrame(resolve);
        });
      });

      centerMobileWord();
      orb.style.transform = 'translate3d(0px,-45%,0)';
      var nextWidth = wordWidth();

      await Promise.all([
        orb.animate(
          [
            {transform:'translate3d(0px,-45%,0)'},
            {transform:'translate3d(' + (nextWidth + gap) + 'px,-45%,0)'}
          ],
          {
            duration:revealTime,
            easing:'cubic-bezier(.22,.72,.18,1)',
            fill:'forwards'
          }
        ).finished,
        word.animate(
          [
            {clipPath:'inset(0 100% 0 0)'},
            {clipPath:'inset(0 0 0 0)'}
          ],
          {
            duration:revealTime,
            easing:'cubic-bezier(.22,.72,.18,1)',
            fill:'forwards'
          }
        ).finished
      ]);

      word.style.clipPath = 'inset(0 0 0 0)';
      orb.style.transform =
        'translate3d(' + (nextWidth + gap) + 'px,-45%,0)';
    }
  }

  var start = function(){
    applyState(states[index]);
    placeOrbAtWordEnd();
    cycle();
  };

  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(start);
  } else {
    window.addEventListener('load', start, {once:true});
  }

  window.addEventListener('resize', placeOrbAtWordEnd);
})();
