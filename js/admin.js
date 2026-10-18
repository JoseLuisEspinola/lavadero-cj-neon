(function () {
    var $ = function (id) { return document.getElementById(id); };

    function pad(value) { return String(value).padStart(2, '0'); }
    function ymd(date) {
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    }
    function element(tag, text, className) {
        var node = document.createElement(tag);
        if (text != null) node.textContent = text;
        if (className) node.className = className;
        return node;
    }
    function formatDate(value) {
        var parts = value.split('-');
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    function formatoPesos(importe) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0,
        }).format(importe);
    }
    function api(url, options) {
        return fetch(url, options).then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (body) {
                if (!response.ok) {
                    var error = new Error(body.error || 'Ocurrió un error.');
                    error.status = response.status;
                    throw error;
                }
                return body;
            });
        });
    }
    function mostrarPanel(autenticado) {
        $('login').hidden = autenticado;
        $('panel').hidden = !autenticado;
        if (autenticado) {
            cargarKioscos().then(cargar).catch(fallo);
            cargarPrecios();
            cargarCupos();
        }
    }
    function fallo(error) {
        if (error.status === 401) {
            mostrarPanel(false);
            $('login-error').textContent = 'La sesión venció. Ingresá nuevamente.';
            return;
        }
        $('panel-error').textContent = error.message;
    }
    function cargar() {
        $('panel-error').textContent = '';
        var params = new URLSearchParams();
        if ($('desde').value) params.set('desde', $('desde').value);
        if ($('hasta').value) params.set('hasta', $('hasta').value);
        params.set('kiosco', $('filtro-kiosco').value);
        api('/api/admin/turnos?' + params.toString())
            .then(function (rows) {
                var body = $('filas');
                var recaudado = 0;
                var realizados = 0;
                var reservado = 0;
                var aCotizar = 0;
                var sinImporte = 0;
                var realizadosSinImporte = 0;
                body.replaceChildren();
                if (!rows.length) {
                    var emptyRow = element('tr');
                    var emptyCell = element('td', 'No hay turnos con esos filtros.');
                    emptyCell.colSpan = 10;
                    emptyRow.appendChild(emptyCell);
                    body.appendChild(emptyRow);
                }
                rows.forEach(function (row) {
                    var tr = element('tr', null, row.estado === 'cancelado' ? 'cancelado' : (row.estado === 'realizado' ? 'realizado' : ''));
                    [formatDate(row.fecha), row.hora, row.servicio, row.vehiculo || '—',
                        row.patente || '—', row.nombre, row.telefono, row.origen].forEach(function (value) {
                        tr.appendChild(element('td', value));
                    });
                    var importe = row.precio == null
                        ? (row.vehiculo ? 'A cotizar' : '—')
                        : formatoPesos(row.precio);
                    tr.appendChild(element('td', importe));
                    if (row.estado === 'realizado') realizados++;
                    if (row.estado === 'realizado' && row.precio != null) recaudado += row.precio;
                    if (row.estado === 'confirmado' && row.precio != null) reservado += row.precio;
                    if (row.estado === 'confirmado' && row.vehiculo && row.precio == null) aCotizar++;
                    if (row.estado === 'confirmado' && !row.vehiculo && row.precio == null) sinImporte++;
                    if (row.estado === 'realizado' && row.precio == null) realizadosSinImporte++;
                    var cell = element('td');
                    cell.className = 'turno-acciones';
                    if (row.estado === 'confirmado') {
                        var realizado = element('button', 'Realizado');
                        realizado.type = 'button';
                        realizado.onclick = function () {
                            abrirDialogoRealizado(row);
                        };
                        cell.appendChild(realizado);
                        var cancel = element('button', 'Cancelar', 'secondary');
                        cancel.type = 'button';
                        cancel.onclick = function () {
                            if (!confirm('¿Cancelar el turno de ' + row.nombre + '?')) return;
                                api('/api/admin/turnos/' + encodeURIComponent(row.id), { method: 'DELETE' })
                                    .then(cargar)
                                    .catch(fallo);
                        };
                        cell.appendChild(cancel);
                    } else if (row.estado === 'realizado') {
                        cell.appendChild(element('span', 'Realizado'));
                        var cancelDeshabilitado = element('button', 'Cancelar', 'secondary');
                        cancelDeshabilitado.type = 'button';
                        cancelDeshabilitado.disabled = true;
                        cancelDeshabilitado.title = 'Un turno realizado no se puede cancelar.';
                        cell.appendChild(cancelDeshabilitado);
                    } else {
                        cell.textContent = 'Cancelado';
                    }
                    tr.appendChild(cell);
                    body.appendChild(tr);
                });
                $('resumen-turnos').textContent =
                    'Turnos realizados: ' + realizados +
                    ' · Importe de realizados: ' + formatoPesos(recaudado) +
                    ' · Reservado pendiente: ' + formatoPesos(reservado) +
                    ' · A cotizar: ' + aCotizar +
                    ' · Históricos sin importe: ' + sinImporte +
                    (realizadosSinImporte ? ' · Realizados sin importe: ' + realizadosSinImporte : '') +
                    ' · Los cancelados no se cuentan.';
            }).catch(fallo);

        api('/api/admin/mensajes').then(function (messages) {
            var box = $('mensajes');
            box.replaceChildren();
            if (!messages.length) box.appendChild(element('p', 'Todavía no hay mensajes.'));
            messages.forEach(function (message) {
                var card = element('article', null, 'message');
                card.appendChild(element('b', message.nombre + ' · ' + message.telefono));
                card.appendChild(element('br'));
                card.appendChild(element('small', message.creado));
                if (message.mensaje) card.appendChild(element('p', message.mensaje));
                box.appendChild(card);
            });
        }).catch(fallo);
    }
    function cargarPrecios() {
        $('precios-estado').textContent = '';
        api('/api/admin/precios').then(function (precios) {
            var lista = $('precios-lista');
            lista.replaceChildren();
            precios.forEach(function (precio) {
                var label = element('label', precio.nombre);
                var input = document.createElement('input');
                input.type = 'number';
                input.name = precio.vehiculo;
                input.min = '0';
                input.max = '1000000000';
                input.step = '1';
                input.required = true;
                input.value = precio.importe;
                label.appendChild(input);
                lista.appendChild(label);
            });
        }).catch(fallo);
    }
    function cargarCupos() {
        $('cupos-estado').textContent = '';
        api('/api/admin/cupos').then(function (result) {
            $('cupos-valor').value = result.cupos;
        }).catch(function (error) {
            $('cupos-estado').textContent = error.message;
        });
    }
    function cargarKioscos() {
        return api('/api/admin/kioscos').then(function (kioscos) {
            var filtro = $('filtro-kiosco');
            var seleccionado = filtro.value || 'todos';
            filtro.replaceChildren(element('option', 'Todos (kioscos y clientes)'));
            filtro.options[0].value = 'todos';
            filtro.appendChild(element('option', 'Clientes'));
            filtro.options[1].value = 'clientes';
            kioscos.forEach(function (kiosco) {
                var option = element('option', kiosco.nombre + (kiosco.activo ? '' : ' (inactivo)'));
                option.value = String(kiosco.id);
                filtro.appendChild(option);
            });
            filtro.value = seleccionado;

            var lista = $('kioscos-lista');
            lista.replaceChildren();
            if (!kioscos.length) lista.appendChild(element('p', 'Todavía no hay kioscos registrados.'));
            kioscos.forEach(function (kiosco) {
                var item = element('article', null, 'kiosco-cuenta');
                item.appendChild(element('strong', kiosco.nombre + (kiosco.activo ? ' · Activo' : ' · Inactivo')));
                var estado = element('button', kiosco.activo ? 'Desactivar' : 'Activar', 'secondary');
                estado.type = 'button';
                estado.onclick = function () {
                    api('/api/admin/kioscos/' + encodeURIComponent(kiosco.id), {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ activo: !kiosco.activo }),
                    }).then(function () {
                        $('kioscos-estado').textContent = 'Estado del kiosco actualizado.';
                        return cargarKioscos();
                    }).then(cargar).catch(function (error) {
                        $('kioscos-estado').textContent = error.message;
                    });
                };
                item.appendChild(estado);
                var clave = element('button', 'Cambiar contraseña', 'secondary');
                clave.type = 'button';
                clave.onclick = function () {
                    var password = prompt('Ingresá la nueva contraseña (mínimo 12 caracteres).');
                    if (password === null) return;
                    if (password.length < 12 || password.length > 200) {
                        $('kioscos-estado').textContent = 'La contraseña debe tener entre 12 y 200 caracteres.';
                        return;
                    }
                    api('/api/admin/kioscos/' + encodeURIComponent(kiosco.id), {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password: password }),
                    }).then(function () {
                        $('kioscos-estado').textContent = 'Contraseña actualizada. Compartila solo con ese kiosco.';
                    }).catch(function (error) {
                        $('kioscos-estado').textContent = error.message;
                    });
                };
                item.appendChild(clave);
                lista.appendChild(item);
            });
        });
    }
    var turnoRealizado = null;
    function abrirDialogoRealizado(row) {
        turnoRealizado = row;
        $('realizado-descripcion').textContent =
            row.nombre + ' · ' + row.servicio + (row.precio == null ? '' : ' · ' + formatoPesos(row.precio));
        $('realizado-importe-label').hidden = row.precio != null;
        $('realizado-importe').required = row.precio == null;
        $('realizado-importe').value = row.precio == null ? '' : row.precio;
        $('realizado-error').textContent = '';
        $('realizado-confirmar').disabled = false;
        $('realizado-dialog').showModal();
        if (row.precio == null) $('realizado-importe').focus();
        else $('realizado-confirmar').focus();
    }

    $('desde').value = '';
    $('hasta').value = '';
    $('ver').onclick = cargar;
    $('filtro-kiosco').addEventListener('change', cargar);
    $('realizado-volver').onclick = function () {
        $('realizado-dialog').close();
        turnoRealizado = null;
    };
    $('realizado-form').addEventListener('submit', function (event) {
        event.preventDefault();
        if (!turnoRealizado) return;
        var importe = turnoRealizado.precio == null ? Number($('realizado-importe').value) : undefined;
        if (importe !== undefined &&
            (!Number.isSafeInteger(importe) || importe < 0 || importe > 1000000000)) {
            $('realizado-error').textContent = 'Ingresá un importe válido en pesos (número entero).';
            $('realizado-importe').focus();
            return;
        }
        var boton = $('realizado-confirmar');
        boton.disabled = true;
        $('realizado-error').textContent = '';
        api('/api/admin/turnos/' + encodeURIComponent(turnoRealizado.id) + '/realizado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(importe === undefined ? {} : { importe: importe }),
        }).then(function () {
            $('realizado-dialog').close();
            turnoRealizado = null;
            cargar();
        }).catch(function (error) {
            $('realizado-error').textContent = error.message;
            boton.disabled = false;
        });
    });
    $('precios-form').addEventListener('submit', function (event) {
        event.preventDefault();
        var precios = Array.prototype.map.call($('precios-lista').querySelectorAll('input'), function (input) {
            return { vehiculo: input.name, importe: Number(input.value) };
        });
        $('precios-estado').textContent = '';
        api('/api/admin/precios', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ precios: precios }),
        }).then(function () {
            $('precios-estado').textContent = 'Precios guardados. Se aplican a los próximos turnos.';
        }).catch(function (error) {
            $('precios-estado').textContent = error.message;
        });
    });
    $('cupos-form').addEventListener('submit', function (event) {
        event.preventDefault();
        var cupos = Number($('cupos-valor').value);
        $('cupos-estado').textContent = '';
        api('/api/admin/cupos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cupos: cupos }),
        }).then(function (result) {
            $('cupos-valor').value = result.cupos;
            $('cupos-estado').textContent = 'Capacidad guardada: ' + result.cupos + ' vehículos por horario.';
        }).catch(function (error) {
            $('cupos-estado').textContent = error.message;
        });
    });
    $('kiosco-form').addEventListener('submit', function (event) {
        event.preventDefault();
        $('kioscos-estado').textContent = '';
        api('/api/admin/kioscos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: $('kiosco-nombre').value.trim(),
                password: $('kiosco-password').value,
            }),
        }).then(function () {
            $('kiosco-form').reset();
            $('kioscos-estado').textContent = 'Acceso creado. Compartí el nombre y la contraseña con ese kiosco.';
            return cargarKioscos();
        }).then(cargar).catch(function (error) {
            $('kioscos-estado').textContent = error.message;
        });
    });
    $('salir').onclick = function () {
        api('/api/admin/logout', { method: 'POST' }).then(function () {
            mostrarPanel(false);
            $('password').value = '';
        }).catch(fallo);
    };
    $('login-form').addEventListener('submit', function (event) {
        event.preventDefault();
        $('login-error').textContent = '';
        api('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: $('password').value }),
        }).then(function () {
            $('password').value = '';
            mostrarPanel(true);
        }).catch(function (error) {
            $('login-error').textContent = error.message;
            $('password').select();
        });
    });

    api('/api/admin/sesion').then(function (session) {
        if (!session.habilitado) {
            $('login-error').textContent = 'El panel aún no está configurado en las variables de entorno.';
        }
        mostrarPanel(session.activa);
    }).catch(function (error) {
        $('login-error').textContent = error.message;
    });
})();
