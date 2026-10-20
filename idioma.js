// Idioma de la portada (20-10-2026): lleva al visitante a la portada en su idioma (es, en, pt, pl).
// - Si eligió idioma con el selector de la cabecera, se respeta siempre (localStorage "idioma").
// - Si no, se usa el idioma del navegador. Catalán, gallego y euskera -> español; otros no soportados -> inglés.
// - Los buscadores no se redirigen (tienen las versiones por hreflang).
(function () {
  var RUTAS = { es: '/', en: '/en/', pt: '/pt/', pl: '/pl/' };
  var A_ESPANOL = ['ca', 'gl', 'eu'];
  var CLAVE = 'idioma';

  function guardado() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function guardar(l) { try { localStorage.setItem(CLAVE, l); } catch (e) { /* sin almacenamiento: no pasa nada */ } }

  function delNavegador() {
    var lista = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'es'];
    for (var i = 0; i < lista.length; i++) {
      var base = String(lista[i]).toLowerCase().split('-')[0];
      if (RUTAS[base]) return base;
      if (A_ESPANOL.indexOf(base) >= 0) return 'es';
    }
    return 'en';
  }

  // El selector fija la preferencia antes de navegar.
  document.querySelectorAll('[data-idioma]').forEach(function (a) {
    a.addEventListener('click', function () { guardar(a.getAttribute('data-idioma')); });
  });

  if (/bot|crawl|spider|slurp|preview/i.test(navigator.userAgent)) return;
  var actual = (document.documentElement.lang || 'es').toLowerCase().split('-')[0];
  var deseado = guardado() || delNavegador();
  if (RUTAS[deseado] && deseado !== actual) location.replace(RUTAS[deseado] + location.search + location.hash);
})();
