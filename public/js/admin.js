// Panel del lavadero: ver y cancelar turnos, leer mensajes.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(x) { return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); }
  function el(tag, txt, cls) { var e = document.createElement(tag); if (txt != null) e.textContent = txt; if (cls) e.className = cls; return e; }
  function fmt(f) { var p = f.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

  function api(url, opts) {
    return fetch(url, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.error || 'Error.'); e.status = r.status; throw e; }
        return j;
      });
    });
  }

  function mostrar(dentro) {
    $('login').hidden = dentro;
    $('panel').hidden = !dentro;
    if (dentro) cargar();
  }

  function fallo(err) {
    if (err.status === 401) { mostrar(false); return; }
    $('pe').textContent = err.message;
  }

  function cargar() {
    $('pe').textContent = '';
    api('/api/admin/turnos?desde=' + $('desde').value).then(function (rows) {
      var tb = $('filas'); tb.innerHTML = '';
      if (!rows.length) {
        var tr0 = el('tr'), td0 = el('td', 'No hay turnos desde esa fecha.'); td0.colSpan = 6; tr0.appendChild(td0); tb.appendChild(tr0);
      }
      rows.forEach(function (r) {
        var tr = el('tr', null, r.estado === 'cancelado' ? 'cancelado' : '');
        [fmt(r.fecha), r.hora, r.servicio, r.nombre, r.telefono].forEach(function (v) { tr.appendChild(el('td', v)); });
        var td = el('td');
        if (r.estado === 'confirmado') {
          var b = el('button', 'Cancelar', 'sec mini');
          b.onclick = function () {
            if (!confirm('¿Cancelar el turno de ' + r.nombre + '?')) return;
            api('/api/admin/turnos/' + r.id, { method: 'DELETE' }).then(cargar).catch(fallo);
          };
          td.appendChild(b);
        }
        tr.appendChild(td); tb.appendChild(tr);
      });
    }).catch(fallo);

    api('/api/admin/mensajes').then(function (ms) {
      var box = $('mensajes'); box.innerHTML = '';
      if (!ms.length) box.appendChild(el('p', 'Todavía no hay mensajes.'));
      ms.forEach(function (m) {
        var d = el('div', null, 'msg');
        d.appendChild(el('b', m.nombre + ' · ' + m.telefono));
        d.appendChild(el('br'));
        d.appendChild(el('small', m.creado));
        if (m.mensaje) d.appendChild(el('p', m.mensaje));
        box.appendChild(d);
      });
    }).catch(function () {});
  }

  $('desde').value = ymd(new Date());
  $('ver').onclick = cargar;
  $('salir').onclick = function () { api('/api/admin/logout', { method: 'POST' }).then(function () { mostrar(false); }); };
  $('lf').addEventListener('submit', function (e) {
    e.preventDefault();
    $('le').textContent = '';
    api('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: $('pw').value })
    }).then(function () { $('pw').value = ''; mostrar(true); })
      .catch(function (err) { $('le').textContent = err.message; });
  });

  api('/api/admin/sesion').then(function (s) {
    if (!s.habilitado) $('le').textContent = 'El panel no está configurado: falta definir la contraseña en el archivo .env.';
    mostrar(s.activa);
  }).catch(function () {});
})();
