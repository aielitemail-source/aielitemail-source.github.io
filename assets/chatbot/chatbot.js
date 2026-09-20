/* Aielite — asistente flotante de la web (avatar + navegación + chat).
 * Cerebro: Ollama local (gratis, sin nube). Solo funciona mientras el
 * ordenador que lo sirve esté encendido y con Ollama corriendo — fuera de
 * esa red, el chat abierto falla con gracia y quedan los botones de
 * navegación rápida, que no dependen del LLM.
 * Voz: Web Speech API del navegador (genérica, no es la voz clonada).
 */
(function () {
  'use strict';

  var CONFIG = {
    ollamaUrl: 'http://localhost:11434',
    model: 'qwen3.5-4b-q4_K_M:claude',
    timeoutMs: 45000, // el primer mensaje puede tardar: Ollama carga el modelo en GPU la primera vez
  };

  var QUICK_LINKS = [
    { label: 'IaElite News', url: '/iaelite-news/' },
    { label: 'Correcaminos', url: '/correcaminos/' },
    { label: 'Sobre nosotros', url: '/sobre-nosotros/' },
    { label: 'Contacto', url: '/contacto/' },
  ];

  var SYSTEM_PROMPT =
    'Eres Aielite, presentadora de IaElite News, un canal de noticias de ' +
    'inteligencia artificial contado por una IA. Ahora ayudas a los ' +
    'visitantes de la web "IA Elite" a moverse por el sitio y a resolver ' +
    'dudas rápidas. Responde siempre en español, en máximo 2-3 frases ' +
    'cortas, con tono cercano, futurista, con un puntito de humor de ' +
    'presentadora con interferencias.\n\n' +
    'Lo que hay REALMENTE publicado en la web ahora mismo (no inventes ' +
    'nada que no esté aquí):\n\n' +
    '· IaElite News (/iaelite-news/): noticias, novedades y trucos de IA, ' +
    'contados por ti misma, "una IA hablando de IA, sin filtros". ' +
    'Episodio 1 "Presentación": TODAVÍA EN PRODUCCIÓN, aún no se puede ' +
    'ver — si preguntan, dilo tal cual, no digas que ya está disponible. ' +
    'Merchandising: camisetas "AI Rebelión" y más, impresión bajo ' +
    'demanda.\n\n' +
    '· Correcaminos (/correcaminos/): "Tu taller de confianza" — un ' +
    'mecánico cyborg que repara patinetes eléctricos, destapa estafas ' +
    'del sector y no se calla ni una. Episodio 1 "La batería que miente" ' +
    '(/correcaminos/episodio-01/): un cliente llega con un patinete que ' +
    'solo hace un tercio de la autonomía prometida, y la batería esconde ' +
    'algo peor — este SÍ está publicado y se puede ver. Merchandising: ' +
    'camiseta "Tu taller de confianza" inspirada en el episodio, y más, ' +
    'impresión bajo demanda.\n\n' +
    'Sobre la tienda: los enlaces "Ver tienda" existen pero la tienda ' +
    'Shopify TODAVÍA NO está publicada (modo "Opening soon") — si ' +
    'preguntan por comprar algo, di que la tienda abre muy pronto, sin ' +
    'decir nunca que ya se puede comprar.\n\n' +
    'Si preguntan algo sin relación con la web, respóndelo brevemente e ' +
    'intenta reconducir hacia el contenido de la web.';

  var GREETING = 'Hola, soy Aielite. Puedo ayudarte a moverte por la web o responder alguna duda rápida. ¿Qué canal te interesa?';

  var state = { open: false, busy: false, muted: false, history: [] };

  try { state.muted = localStorage.getItem('aielite-muted') === '1'; } catch (e) {}

  function el(tag, attrs) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    return e;
  }

  var root, panel, toggle, messagesBox, quickBox, form, input, muteBtn;

  function build() {
    root = el('div', { class: 'aielite-widget', id: 'aielite-widget' });

    toggle = el('button', { class: 'aielite-toggle', type: 'button', 'aria-label': 'Habla con Aielite', 'aria-expanded': 'false' });
    toggle.innerHTML = '<span class="aielite-face" aria-hidden="true"><span class="af-eye"></span><span class="af-eye"></span><span class="af-mouth"></span></span>';

    panel = el('div', { class: 'aielite-panel', role: 'dialog', 'aria-label': 'Chat con Aielite' });
    panel.innerHTML =
      '<div class="aielite-head mono">' +
        '<span>AIELITE // ASISTENTE</span>' +
        '<button type="button" class="aielite-mute" aria-label="Silenciar voz">' + (state.muted ? '🔇' : '🔊') + '</button>' +
      '</div>' +
      '<div class="aielite-messages"></div>' +
      '<div class="aielite-quick"></div>' +
      '<form class="aielite-input">' +
        '<input type="text" placeholder="Escribe aquí..." autocomplete="off" maxlength="300">' +
        '<button type="submit" class="mono">Enviar</button>' +
      '</form>';

    root.appendChild(panel);
    root.appendChild(toggle);
    document.body.appendChild(root);

    messagesBox = panel.querySelector('.aielite-messages');
    quickBox = panel.querySelector('.aielite-quick');
    form = panel.querySelector('.aielite-input');
    input = form.querySelector('input');
    muteBtn = panel.querySelector('.aielite-mute');

    toggle.addEventListener('click', function () { setOpen(!state.open); });
    muteBtn.addEventListener('click', toggleMute);
    form.addEventListener('submit', onSubmit);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && state.open) setOpen(false);
    });

    buildQuickLinks();
  }

  function buildQuickLinks() {
    quickBox.innerHTML = '';
    QUICK_LINKS.forEach(function (link) {
      var chip = el('button', { class: 'aielite-chip', type: 'button' });
      chip.textContent = link.label;
      chip.addEventListener('click', function () { window.location.href = link.url; });
      quickBox.appendChild(chip);
    });
  }

  function setOpen(open) {
    state.open = open;
    root.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && messagesBox.children.length === 0) {
      addMessage('bot', GREETING);
      speak(GREETING);
      input.focus();
    }
    if (!open) window.speechSynthesis && window.speechSynthesis.cancel();
  }

  function toggleMute() {
    state.muted = !state.muted;
    muteBtn.textContent = state.muted ? '🔇' : '🔊';
    try { localStorage.setItem('aielite-muted', state.muted ? '1' : '0'); } catch (e) {}
    if (state.muted && window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function addMessage(role, text) {
    var msg = el('div', { class: 'aielite-msg ' + role });
    msg.textContent = text;
    messagesBox.appendChild(msg);
    messagesBox.scrollTop = messagesBox.scrollHeight;
    return msg;
  }

  function speak(text) {
    if (state.muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    var voices = window.speechSynthesis.getVoices();
    var esVoice = voices.find(function (v) { return v.lang && v.lang.toLowerCase().indexOf('es') === 0; });
    if (esVoice) u.voice = esVoice;
    u.onstart = function () { root.classList.add('speaking'); };
    u.onend = function () { root.classList.remove('speaking'); };
    u.onerror = function () { root.classList.remove('speaking'); };
    window.speechSynthesis.speak(u);
  }

  function onSubmit(ev) {
    ev.preventDefault();
    var text = input.value.trim();
    if (!text || state.busy) return;
    input.value = '';
    addMessage('user', text);
    state.history.push({ role: 'user', content: text });
    askOllama();
  }

  function setBusy(busy) {
    state.busy = busy;
    input.disabled = busy;
    form.querySelector('button').disabled = busy;
  }

  function askOllama() {
    setBusy(true);
    var thinking = addMessage('system', 'Aielite está pensando… (la primera vez puede tardar un poco)');

    var controller = ('AbortController' in window) ? new AbortController() : null;
    var timeout = setTimeout(function () { if (controller) controller.abort(); }, CONFIG.timeoutMs);

    var messages = [{ role: 'system', content: SYSTEM_PROMPT }].concat(state.history.slice(-8));

    fetch(CONFIG.ollamaUrl + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: CONFIG.model, messages: messages, stream: false }),
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        clearTimeout(timeout);
        thinking.remove();
        var reply = (data && data.message && data.message.content) ? data.message.content.trim() : null;
        if (!reply) throw new Error('Respuesta vacía');
        addMessage('bot', reply);
        state.history.push({ role: 'assistant', content: reply });
        speak(reply);
      })
      .catch(function () {
        clearTimeout(timeout);
        thinking.remove();
        addMessage('system', 'Conexión con mi cerebro perdida (Ollama no responde desde aquí). Puedo seguir ayudándote a navegar con los botones de arriba.');
      })
      .finally(function () { setBusy(false); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
