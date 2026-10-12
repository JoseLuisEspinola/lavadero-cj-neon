// Ventana inicial: "Soy cliente" sigue a la página, "Soy administrador" pide la contraseña.
(function () {
  var box = document.getElementById('acc');
  if (!box) return;
  var op = document.getElementById('acc-op'), f = document.getElementById('acc-f'),
      pw = document.getElementById('acc-pw'), er = document.getElementById('acc-e');
  var activa = false;

  function guardado() { try { return sessionStorage.getItem('acc') === '1'; } catch (e) { return false; } }
  function recordar() { try { sessionStorage.setItem('acc', '1'); } catch (e) {} }

  function cerrar() {
    box.hidden = true;
    document.body.style.overflow = '';
    recordar();
  }

  // Si ya la cerró en esta sesión, no se vuelve a mostrar
  if (guardado()) { box.hidden = true; return; }

  document.body.style.overflow = 'hidden';
  document.getElementById('acc-cli').focus();

  var forzar = /[?&]admin(=|&|$)/.test(location.search);
  fetch('/api/config').then(function (r) { return r.json(); }).then(function (c) {
    if (c.accesoAdmin === false && !forzar) cerrar();
  }).catch(function () {});

  fetch('/api/admin/sesion').then(function (r) { return r.json(); })
    .then(function (s) { activa = !!s.activa; }).catch(function () {});

  document.getElementById('acc-cli').onclick = cerrar;

  document.getElementById('acc-adm').onclick = function () {
    if (activa) { location.href = '/admin'; return; }
    op.hidden = true; f.hidden = false; pw.focus();
  };

  document.getElementById('acc-back').onclick = function () {
    f.hidden = true; op.hidden = false; er.textContent = ''; pw.value = '';
    document.getElementById('acc-adm').focus();
  };

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    er.textContent = '';
    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw.value })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || 'No se pudo ingresar.');
        location.href = '/admin';
      });
    }).catch(function (err) { er.textContent = err.message; pw.select(); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !box.hidden) cerrar();
  });
})();
