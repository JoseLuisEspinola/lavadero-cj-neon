// Reserva de turnos: elegir servicio, día y horario, y dejar nombre y teléfono.
(function () {
  var bk = document.getElementById('bk');
  if (!bk) return;
  var srv = document.getElementById('srv'), d = document.getElementById('bd'),
      sl = document.getElementById('bs'), ms = document.getElementById('bm');
  var btn = bk.querySelector('button[type=submit]');
  var sel = null, horarios = [], abierto = [1, 2, 3, 4, 5, 6];

  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(x) { return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); }
  function aviso(t) { ms.textContent = t; }

  function api(url, opts) {
    return fetch(url, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.error || 'Algo salió mal. Probá de nuevo.'); e.status = r.status; throw e; }
        return j;
      });
    });
  }

  function dibujar() {
    sl.innerHTML = '';
    horarios.forEach(function (h) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = h.hora;
      b.disabled = !h.libre;
      if (!h.libre) b.title = 'Ocupado';
      b.setAttribute('aria-pressed', String(h.hora === sel && h.libre));
      b.onclick = function () { sel = h.hora; dibujar(); };
      sl.appendChild(b);
    });
  }

  function cargar() {
    sel = null;
    if (!d.value) { sl.textContent = 'Elegí un día.'; return; }
    sl.textContent = 'Buscando horarios…';
    api('/api/horarios?fecha=' + d.value)
      .then(function (r) { horarios = r.horarios; dibujar(); })
      .catch(function (e) { sl.textContent = e.message; });
  }

  function primerDiaAbierto() {
    var t = new Date();
    for (var i = 0; i < 8; i++) {
      t.setDate(t.getDate() + 1);
      if (abierto.indexOf(t.getDay()) !== -1) break;
    }
    return ymd(t);
  }

  api('/api/config').then(function (c) {
    c.servicios.forEach(function (s) { var o = document.createElement('option'); o.textContent = s; srv.appendChild(o); });
    abierto = c.diasAbierto;
    var hasta = new Date(); hasta.setDate(hasta.getDate() + c.diasAdelante);
    d.min = ymd(new Date()); d.max = ymd(hasta); d.value = primerDiaAbierto();
    cargar();
  }).catch(function () { aviso('No pudimos cargar los turnos. Recargá la página.'); });

  d.addEventListener('change', cargar);

  bk.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = bk.nombre.value.trim(), t = bk.tel.value.trim();
    if (!sel || !n || !t) { aviso('Elegí un horario y completá nombre y teléfono.'); return; }
    btn.disabled = true;
    api('/api/turnos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ servicio: srv.value, fecha: d.value, hora: sel, nombre: n, telefono: t })
    }).then(function (r) {
      var p = r.fecha.split('-');
      aviso('¡Turno reservado! ' + p[2] + '/' + p[1] + ' a las ' + r.hora + '. Te esperamos, ' + n + '.');
      bk.nombre.value = ''; bk.tel.value = '';
      cargar();
    }).catch(function (err) {
      aviso(err.message);
      if (err.status === 409) cargar();
    }).then(function () { btn.disabled = false; });
  });
})();
