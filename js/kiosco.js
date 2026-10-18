(function () {
    var $ = function (id) { return document.getElementById(id); };

    function api(url, options) {
        return fetch(url, options).then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (body) {
                if (!response.ok) throw new Error(body.error || 'Ocurrió un error.');
                return body;
            });
        });
    }

    function mostrarSesion(sesion) {
        $('login').hidden = sesion.activa;
        $('kiosco-panel').hidden = !sesion.activa;
        if (sesion.activa) $('kiosco-identidad').textContent = sesion.nombre;
    }

    $('kiosco-login-form').addEventListener('submit', function (event) {
        event.preventDefault();
        $('kiosco-login-error').textContent = '';
        api('/api/kiosco/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: $('kiosco-login-nombre').value.trim(),
                password: $('kiosco-login-password').value,
            }),
        }).then(function () {
            $('kiosco-login-password').value = '';
            return api('/api/kiosco/sesion');
        }).then(mostrarSesion).catch(function (error) {
            $('kiosco-login-error').textContent = error.message;
        });
    });

    $('kiosco-salir').addEventListener('click', function () {
        api('/api/kiosco/logout', { method: 'POST' }).then(function () {
            window.location.reload();
        }).catch(function (error) {
            $('kiosco-login-error').textContent = error.message;
        });
    });

    api('/api/kiosco/sesion').then(mostrarSesion).catch(function (error) {
        $('kiosco-login-error').textContent = error.message;
    });
})();
