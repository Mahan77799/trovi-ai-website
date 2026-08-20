(function(){
  var activeClient = null;
  var activeTrigger = null;
  var sdkPromise = null;
  var closing = false;

  var labels = {
    restaurant: 'Restaurant',
    dental: 'Dental Clinic',
    accounting: 'Accounting Firm',
    salon: 'Salon'
  };

  function loadSdk(){
    if (window.__troviRetellSdk) return Promise.resolve(window.__troviRetellSdk);
    if (!sdkPromise) {
      sdkPromise = import('https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.8/+esm')
        .then(function(mod){
          if (!mod || !mod.RetellWebClient) throw new Error('Retell Web SDK unavailable');
          window.__troviRetellSdk = mod;
          return mod;
        });
    }
    return sdkPromise;
  }

  function ensureModal(){
    var modal = document.getElementById('troviBrowserDemoModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'troviBrowserDemoModal';
    modal.className = 'browser-demo-modal retell-demo-modal';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML = ''+
      '<div class="browser-demo-backdrop" data-demo-close></div>'+
      '<div class="browser-demo-shell" role="dialog" aria-modal="true" aria-labelledby="troviDemoTitle">'+
        '<button class="browser-demo-close" type="button" data-demo-close aria-label="Close live demo">×</button>'+
        '<div class="browser-demo-status"><i></i><span>LIVE TROVI DEMO</span></div>'+
        '<div class="browser-demo-body">'+
          '<div class="retell-demo-stage">'+
            '<div class="retell-demo-orb" aria-hidden="true"><span></span></div>'+
            '<h3 id="troviDemoTitle">Connecting…</h3>'+
            '<p class="retell-demo-message">Preparing a private browser call. No phone number is dialled.</p>'+
            '<div class="retell-demo-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
            '<button class="retell-demo-end" type="button" data-demo-end disabled>End demo</button>'+
            '<small class="retell-demo-note">Your browser may ask for microphone permission the first time.</small>'+
          '</div>'+
        '</div>'+
      '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){
      if (e.target.hasAttribute('data-demo-close')) closeDemo();
      if (e.target.hasAttribute('data-demo-end')) stopActiveCall();
    });
    return modal;
  }

  function ui(){
    var modal = ensureModal();
    return {
      modal: modal,
      title: modal.querySelector('#troviDemoTitle'),
      message: modal.querySelector('.retell-demo-message'),
      stage: modal.querySelector('.retell-demo-stage'),
      end: modal.querySelector('[data-demo-end]')
    };
  }

  function setState(state, title, message){
    var x = ui();
    x.stage.classList.remove('is-connecting','is-live','is-speaking','is-ended','is-error');
    x.stage.classList.add('is-' + state);
    if (title) x.title.textContent = title;
    if (message) x.message.textContent = message;
    x.end.disabled = !(state === 'live' || state === 'speaking');
  }

  function resetTrigger(){
    if (activeTrigger) activeTrigger.classList.remove('retell-demo-active');
    activeTrigger = null;
  }

  function stopActiveCall(){
    if (!activeClient) return;
    try { activeClient.stopCall(); } catch (_) {}
  }

  function closeDemo(){
    if (closing) return;
    closing = true;
    stopActiveCall();
    var modal = document.getElementById('troviBrowserDemoModal');
    if (modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden','true');
    }
    activeClient = null;
    resetTrigger();
    closing = false;
  }

  async function requestMicrophone(){
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser.');
    }
    var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(function(track){ track.stop(); });
  }

  async function startDemo(kind, trigger){
    kind = String(kind || '').toLowerCase();
    if (!labels[kind]) return;

    if (activeClient) {
      try { activeClient.stopCall(); } catch (_) {}
      activeClient = null;
    }

    activeTrigger = trigger || null;
    if (activeTrigger) activeTrigger.classList.add('retell-demo-active');

    var x = ui();
    x.modal.classList.add('is-open');
    x.modal.setAttribute('aria-hidden','false');
    setState('connecting', 'Connecting to the ' + labels[kind] + ' demo…', 'Stay on this page. Trovi is opening a live voice session in your browser.');

    try {
      // Ask for microphone permission directly from the user's click before
      // creating the Retell session. This is especially important on mobile Safari.
      setState('connecting', 'Microphone access…', 'Allow microphone access so the live Trovi agent can hear you.');
      await requestMicrophone();
      setState('connecting', 'Connecting to the ' + labels[kind] + ' demo…', 'Microphone ready. Trovi is opening the live voice session.');

      var results = await Promise.all([
        loadSdk(),
        fetch('/api/create-web-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demo: kind })
        }).then(async function(response){
          var payload = await response.json().catch(function(){ return {}; });
          if (!response.ok || !payload.accessToken) throw new Error(payload.error || 'Unable to create web call');
          return payload;
        })
      ]);

      var RetellWebClient = results[0].RetellWebClient;
      var call = results[1];
      var client = new RetellWebClient();
      activeClient = client;

      client.on('call_started', function(){
        setState('live', 'You’re live with Trovi.', 'Speak naturally — the agent can hear you through your browser.');
      });
      client.on('call_ready', function(){
        setState('live', 'You’re live with Trovi.', 'Speak naturally — the agent can hear you through your browser.');
      });
      client.on('agent_start_talking', function(){
        setState('speaking', labels[kind] + ' demo is speaking', 'You can interrupt naturally, just like a real phone conversation.');
      });
      client.on('agent_stop_talking', function(){
        setState('live', 'Your turn.', 'Ask a question or make a request exactly as a customer would.');
      });
      client.on('call_ended', function(){
        activeClient = null;
        resetTrigger();
        setState('ended', 'Demo ended.', 'Thanks for trying Trovi. Close this window or start another industry demo.');
      });
      client.on('error', function(error){
        console.error('Retell web demo error', error);
        try { client.stopCall(); } catch (_) {}
        activeClient = null;
        resetTrigger();
        setState('error', 'We couldn’t connect the demo.', 'Please check microphone permission and try again.');
      });

      await client.startCall({ accessToken: call.accessToken });
      // Explicitly ensure capture is not left muted and resume browser audio.
      // Retell documents unmute() for resuming microphone transmission.
      try { client.unmute(); } catch (_) {}
      try { await client.startAudioPlayback(); } catch (_) {}
    } catch (error) {
      console.error('Trovi Retell demo startup error', error);
      activeClient = null;
      resetTrigger();
      var errorText = String(error && error.message || '');
      var msg = /configured/i.test(errorText)
        ? 'The live demo is not configured on this deployment yet.'
        : (/permission|denied|microphone|notallowed/i.test(errorText)
          ? 'Microphone access is required. Allow microphone access for troviai.com, then try the demo again.'
          : 'Please check your connection and microphone permission, then try again.');
      setState('error', 'We couldn’t connect the demo.', msg);
    }
  }

  window.openTroviBrowserDemo = function(kind, trigger){ return startDemo(kind, trigger); };

  document.addEventListener('click', function(e){
    var target = e.target.closest('[data-web-demo]');
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    startDemo(target.getAttribute('data-web-demo'), target);
  }, true);

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeDemo();
  });
})();
