function validarFormulario(event) {
    var servicio = document.getElementById("servicio").value;
    var fecha = document.getElementById("fecha").value;
    var hora = document.getElementById("hora").value;
    var nombre = document.getElementById("nombre").value.trim();
    var telefono = document.getElementById("telefono").value.trim();
    var mensaje = document.getElementById("mensaje").value.trim();
    var check = document.getElementById("check-priv").checked;
    var errores = [];

    if (servicio.trim() === "") errores.push("Por favor, ingrese el tipo de servicio.");
    if (fecha.trim() === "") errores.push("Por favor, ingrese la fecha del servicio.");
    if (hora.trim() === "") errores.push("Por favor, ingrese la hora del servicio.");
    if (!nombre) errores.push("Por favor, ingrese su nombre completo.");
    if (!/^\+?[0-9]{2}-?[0-9]{10}$/.test(telefono)) {
        errores.push("El teléfono debe tener el formato correcto (+54-1234567810).");
    }
    if (!mensaje) errores.push("Por favor, ingrese su mensaje, mínimo 8 caracteres!!!.");
    if (!check) errores.push("Debe aceptar enviar los datos.");

    if (errores.length) {
        event.preventDefault();
        alert(errores.join("\n"));
        return false;
    }
    return true;
}

var formularioContacto = document.getElementById("form-contacto");
var camposFechaHora = [
    document.getElementById("fecha"),
    document.getElementById("hora")
];

function actualizarColorFechaHora() {
    camposFechaHora.forEach(function (campo) {
        campo.classList.toggle("has-value", campo.value !== "");
    });
}

camposFechaHora.forEach(function (campo) {
    campo.addEventListener("input", actualizarColorFechaHora);
    campo.addEventListener("change", actualizarColorFechaHora);
});

formularioContacto.addEventListener("reset", function () {
    window.setTimeout(actualizarColorFechaHora, 0);
    var status = document.getElementById("contacto-estado");
    status.textContent = "";
    status.hidden = true;
});

formularioContacto.addEventListener("submit", function (event) {
    event.preventDefault();
    var status = document.getElementById("contacto-estado");
    if (!validarFormulario(event)) return;

    var submit = formularioContacto.querySelector('input[type="submit"]');
    var message = [
        "Servicio consultado: " + document.getElementById("servicio").selectedOptions[0].textContent,
        "Fecha solicitada: " + document.getElementById("fecha").value,
        "Hora solicitada: " + document.getElementById("hora").value,
        "Dirección: " + document.getElementById("direccion").value.trim(),
        "Correo: " + document.getElementById("email").value.trim(),
        "",
        document.getElementById("mensaje").value.trim()
    ].join("\n");

    if (message.length > 1000) {
        status.hidden = false;
        status.textContent = "El mensaje es demasiado largo. Acortalo y volvé a intentar.";
        return;
    }

    status.hidden = false;
    status.textContent = "Enviando…";
    submit.disabled = true;
    fetch("/api/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nombre: document.getElementById("nombre").value.trim(),
            telefono: document.getElementById("telefono").value.trim(),
            mensaje: message
        })
    }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (body) {
            if (!response.ok) throw new Error(body.error || "No se pudo enviar el formulario.");
            formularioContacto.reset();
            status.hidden = false;
            status.textContent = "¡Consulta enviada! Te responderemos pronto.";
        });
    }).catch(function (error) {
        status.textContent = error.message;
    }).then(function () {
        submit.disabled = false;
    });
});
