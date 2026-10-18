(function () {
    var form = document.getElementById('form-turnos');
    if (!form) return;

    var servicio = document.getElementById('turno-servicio');
    var vehiculo = document.getElementById('turno-vehiculo');
    var patente = document.getElementById('turno-patente');
    var fecha = document.getElementById('turno-fecha');
    var horariosBox = document.getElementById('turno-horarios');
    var mensaje = document.getElementById('turno-mensaje');
    var precioMensaje = document.getElementById('turno-precio');
    var submit = form.querySelector('button[type="submit"]');
    var seleccion = null;
    var horarios = [];
    var configTurnos;

    function pad(value) { return String(value).padStart(2, '0'); }
    function ymd(date) {
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    }
    function aviso(text) { mensaje.textContent = text; }
    function formatoPesos(importe) {
        return '$' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(importe);
    }
    function actualizarPrecio() {
        if (!configTurnos || !servicio.value || !vehiculo.value) return;
        if (configTurnos.serviciosConPrecio.indexOf(servicio.value) === -1) {
            precioMensaje.textContent = 'Este servicio es a cotizar.';
            return;
        }
        precioMensaje.textContent = 'Precio según vehículo: ' + formatoPesos(configTurnos.precios[vehiculo.value]);
    }
    function api(url, options) {
        return fetch(url, options).then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (body) {
                if (!response.ok) {
                    var error = new Error(body.error || 'Algo salió mal. Probá de nuevo.');
                    error.status = response.status;
                    throw error;
                }
                return body;
            });
        });
    }
    function dibujarHorarios() {
        horariosBox.replaceChildren();
        horarios.forEach(function (slot) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'turno-slot';
            button.textContent = slot.hora;
            button.disabled = !slot.libre;
            button.setAttribute('aria-pressed', String(slot.hora === seleccion && slot.libre));
            if (!slot.libre) button.title = 'No disponible';
            button.onclick = function () {
                seleccion = slot.hora;
                dibujarHorarios();
            };
            horariosBox.appendChild(button);
        });
    }
    function cargarHorarios() {
        seleccion = null;
        if (!fecha.value) {
            horariosBox.textContent = 'Elegí un día para consultar los horarios.';
            return;
        }
        horariosBox.textContent = 'Buscando horarios…';
        api('/api/horarios?fecha=' + encodeURIComponent(fecha.value))
            .then(function (result) {
                horarios = result.horarios;
                dibujarHorarios();
            })
            .catch(function (error) { horariosBox.textContent = error.message; });
    }

    api('/api/config').then(function (config) {
        if (!Array.isArray(config.servicios) || !Array.isArray(config.vehiculos) ||
            !config.precios || !Array.isArray(config.serviciosConPrecio)) {
            throw new Error('La configuración de servicios y vehículos está incompleta.');
        }
        configTurnos = config;
        servicio.replaceChildren();
        vehiculo.replaceChildren();
        var servicioPlaceholder = document.createElement('option');
        servicioPlaceholder.value = '';
        servicioPlaceholder.textContent = 'Elegí un servicio';
        servicioPlaceholder.disabled = true;
        servicioPlaceholder.selected = true;
        servicio.appendChild(servicioPlaceholder);
        config.servicios.forEach(function (name) {
            var option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            servicio.appendChild(option);
        });
        var vehiculoPlaceholder = document.createElement('option');
        vehiculoPlaceholder.value = '';
        vehiculoPlaceholder.textContent = 'Elegí un tipo de vehículo';
        vehiculoPlaceholder.disabled = true;
        vehiculoPlaceholder.selected = true;
        vehiculo.appendChild(vehiculoPlaceholder);
        config.vehiculos.forEach(function (item) {
            var option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.nombre;
            vehiculo.appendChild(option);
        });
        Object.keys(config.precios).forEach(function (id) {
            var price = document.querySelector('[data-price-vehicle="' + id + '"]');
            if (price) price.textContent = formatoPesos(config.precios[id]);
        });
        actualizarPrecio();
        var today = new Date();
        var latest = new Date(today);
        latest.setDate(latest.getDate() + config.diasAdelante);
        fecha.min = ymd(today);
        fecha.max = ymd(latest);

        var firstOpenDay = new Date(today);
        firstOpenDay.setDate(firstOpenDay.getDate() + 1);
        for (var offset = 0; offset <= config.diasAdelante; offset++) {
            if (config.diasAbierto.indexOf(firstOpenDay.getDay()) !== -1) break;
            firstOpenDay.setDate(firstOpenDay.getDate() + 1);
        }
        fecha.value = ymd(firstOpenDay);
        cargarHorarios();
    }).catch(function (error) {
        var serviceError = document.createElement('option');
        serviceError.textContent = 'No se pudieron cargar los servicios';
        serviceError.disabled = true;
        servicio.replaceChildren(serviceError);
        var vehicleError = document.createElement('option');
        vehicleError.textContent = 'No se pudieron cargar los vehículos';
        vehicleError.disabled = true;
        vehiculo.replaceChildren(vehicleError);
        submit.disabled = true;
        aviso('No pudimos cargar la configuración de turnos: ' + error.message);
    });

    fecha.addEventListener('change', cargarHorarios);
    servicio.addEventListener('change', actualizarPrecio);
    vehiculo.addEventListener('change', actualizarPrecio);
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        var nombre = document.getElementById('turno-nombre').value.trim();
        var telefono = document.getElementById('turno-telefono').value.trim();
        var patenteValue = patente.value.trim();
        if (!seleccion || !nombre || !telefono || !patenteValue) {
            aviso('Elegí un horario y completá nombre, teléfono y patente.');
            return;
        }
        submit.disabled = true;
        aviso('');
        api('/api/turnos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                servicio: servicio.value,
                vehiculo: vehiculo.value,
                fecha: fecha.value,
                hora: seleccion,
                nombre: nombre,
                telefono: telefono,
                patente: patenteValue,
            }),
        }).then(function (result) {
            var parts = result.fecha.split('-');
            aviso('¡Turno reservado! ' + parts[2] + '/' + parts[1] + ' a las ' + result.hora + '. Te esperamos, ' + nombre + '.');
            document.getElementById('turno-nombre').value = '';
            document.getElementById('turno-telefono').value = '';
            patente.value = '';
            cargarHorarios();
        }).catch(function (error) {
            aviso(error.message);
            if (error.status === 409) cargarHorarios();
        }).then(function () { submit.disabled = false; });
    });
})();
