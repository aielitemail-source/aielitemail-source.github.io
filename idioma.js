// Idioma de la web (20-10-2026): lleva al visitante a ESTA misma página en su idioma y pinta el selector de idiomas.
// - Las versiones de cada página salen de sus <link rel="alternate" hreflang> (las pone web-traducir.js).
// - Si el visitante eligió idioma en el selector, se respeta siempre (localStorage "idioma").
// - Si no, se usa el del navegador: catalán, gallego y euskera -> español; idiomas sin versión -> inglés.
// - Los buscadores no se redirigen (ya tienen los hreflang).
(function () {
  var NOMBRES = { es: 'Español', en: 'English', fr: 'Français', de: 'Deutsch', pt: 'Português', it: 'Italiano', ru: 'Русский',
    zh: '中文', ja: '日本語', ar: 'العربية', pl: 'Polski', nl: 'Nederlands', tr: 'Türkçe', cs: 'Čeština', hu: 'Magyar', ko: '한국어' };
  var A_ESPANOL = ['ca', 'gl', 'eu'];
  var CLAVE = 'idioma';
  var codigo = function (l) { return String(l || '').toLowerCase().split('-')[0]; };

  function guardado() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function guardar(l) { try { localStorage.setItem(CLAVE, l); } catch (e) { /* sin almacenamiento: no pasa nada */ } }

  var versiones = {};
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(function (l) {
    var c = codigo(l.getAttribute('hreflang'));
    if (c !== 'x' && NOMBRES[c]) versiones[c] = new URL(l.href).pathname; // misma web (también en local)
  });
  var actual = codigo(document.documentElement.lang) || 'es';
  if (!versiones[actual]) versiones[actual] = location.pathname;

  function ir(c) { if (versiones[c] && c !== actual) location.replace(versiones[c] + location.search + location.hash); }

  function delNavegador() {
    var lista = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'es'];
    for (var i = 0; i < lista.length; i++) {
      var c = codigo(lista[i]);
      if (versiones[c]) return c;
      if (A_ESPANOL.indexOf(c) >= 0) return 'es';
    }
    return versiones.en ? 'en' : actual;
  }

  // Selector: sustituye al de la portada (.idiomas) o se añade a la cabecera.
  var cods = Object.keys(NOMBRES).filter(function (c) { return versiones[c]; });
  if (cods.length > 1) {
    var sel = document.createElement('select');
    sel.className = 'idiomas-select mono';
    sel.setAttribute('aria-label', 'Idioma / Language');
    sel.style.cssText = 'background:transparent;color:inherit;border:1px solid currentColor;border-radius:8px;padding:.2rem .35rem;font-size:.72rem;cursor:pointer';
    cods.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c; o.textContent = NOMBRES[c]; o.style.color = '#111';
      if (c === actual) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () { guardar(sel.value); ir(sel.value); });
    var viejo = document.querySelector('.idiomas');
    var sitio = document.querySelector('header .header-right');
    if (viejo) viejo.replaceWith(sel);
    else if (sitio) sitio.insertBefore(sel, sitio.firstChild);
    else { sel.style.cssText += ';position:fixed;top:.6rem;right:.6rem;z-index:50;background:#0b0b10;color:#fff'; document.body.appendChild(sel); }
  }

  if (/bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent)) return;
  ir(guardado() || delNavegador());
})();
