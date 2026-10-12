// Burbujas de la portada, animación de créditos y formulario de contacto.
(function () {
  var rm = matchMedia('(prefers-reduced-motion:reduce)').matches;

  // Burbujas de la portada
  var hero = document.getElementById('inicio');
  if (hero && !rm) {
    for (var i = 0; i < 16; i++) {
      var b = document.createElement('i');
      b.className = 'bub';
      var s = 14 + Math.random() * 50;
      b.style.cssText =
        'width:' + s + 'px;height:' + s + 'px;left:' + Math.random() * 100 + '%;--dx:' + (Math.random() * 80 - 40) +
        'px;animation-duration:' + (8 + Math.random() * 10) + 's;animation-delay:-' + Math.random() * 14 + 's';
      hero.appendChild(b);
    }
  }

  // Créditos: el nombre cae como gotas y salta al tocarlo
  var w = document.getElementById('w');
  var sec = document.getElementById('creditos');
  if (w && sec) {
    var txt = 'Lavadero CJ';
    for (var k = 0; k < txt.length; k++) {
      var sp = document.createElement('span');
      sp.className = 'ch' + (k > 8 ? ' cj' : '');
      sp.setAttribute('aria-hidden', 'true');
      sp.style.setProperty('--i', k);
      sp.textContent = txt[k] === ' ' ? '\u00a0' : txt[k];
      w.appendChild(sp);
    }
    var chs = w.querySelectorAll('.ch');
    var hop = function (e) { e.classList.remove('hop'); void e.offsetWidth; e.classList.add('hop'); };
    w.addEventListener('pointerover', function (e) { if (e.target.classList.contains('ch')) hop(e.target); });

    var bubble = function (x, y) {
      if (rm) return;
      var p = document.createElement('span'), s = 16 + Math.random() * 34;
      p.className = 'pop';
      p.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (x - s / 2) + 'px;top:' + (y - s / 2) + 'px';
      p.onanimationend = function () { p.remove(); };
      sec.appendChild(p);
    };
    sec.addEventListener('click', function (e) {
      var r = sec.getBoundingClientRect();
      for (var n = 0; n < 5; n++) bubble(e.clientX - r.left + Math.random() * 40 - 20, e.clientY - r.top + Math.random() * 40 - 20);
      if (e.target.classList.contains('ch')) chs.forEach(function (el, j) { setTimeout(function () { hop(el); }, j * 60); });
    });

    if (!rm && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { chs.forEach(function (el) { el.classList.add('drop'); }); io.disconnect(); }
      }, { threshold: 0.5 });
      io.observe(w);
    }
  }

  // Formulario de contacto
  var f = document.getElementById('f'), st = document.getElementById('st');
  if (f && st) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = f.nombre.value.trim(), t = f.telefono.value.trim();
      if (!n || !t) { st.textContent = 'Completá tu nombre y teléfono.'; return; }
      fetch('/api/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: n, telefono: t, mensaje: f.mensaje.value.trim() })
      })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) {
            if (!r.ok) throw new Error(j.error || 'No se pudo enviar. Probá de nuevo.');
            st.textContent = '¡Mensaje enviado! Te respondemos pronto.';
            f.reset();
          });
        })
        .catch(function (err) { st.textContent = err.message; });
    });
  }
})();
