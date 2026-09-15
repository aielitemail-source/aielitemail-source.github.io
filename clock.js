function tickClock() {
  var el = document.getElementById('sys-clock');
  if (!el) return;
  var d = new Date();
  var pad = function (n, len) { return String(n).padStart(len || 2, '0'); };
  el.innerHTML = 'SYS TIME ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) +
    '<span class="ms">.' + pad(d.getMilliseconds(), 3) + '</span>';
}
setInterval(tickClock, 47);
tickClock();
