<?php
// Configuración básica
// Reemplaza esta dirección de correo con la que quieres recibir los mensajes
/* $destinatario = "ng9104944@gmail.com"; */ 
$destinatario = "ng9104944@gmail.com";
$asunto = "Nuevo mensaje de contacto desde la web de Aires Nico";

// Verificamos que el formulario haya sido enviado por el método POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Recopilamos y sanitizamos los datos del formulario (para evitar inyecciones de código)
    $servicio = htmlspecialchars(trim($_POST["servicio"]));
    $fecha = htmlspecialchars(trim($_POST["fecha"]));
    $hora = htmlspecialchars(trim($_POST["hora"]));
    $nombre = htmlspecialchars(trim($_POST["nombre"]));
    $direccion = htmlspecialchars(trim($_POST["direccion"]));
    $altura = htmlspecialchars(trim($_POST["altura"]));
    $telefono = htmlspecialchars(trim($_POST["telefono"]));
    $email = htmlspecialchars(trim($_POST["email"]));
    $mensaje = htmlspecialchars(trim($_POST["mensaje"]));

    // Validamos que los campos requeridos no estén vacíos
    if (empty($nombre) || empty($email) || empty($mensaje) || empty($telefono)) {
        echo "Por favor, complete los campos obligatorios.";
        exit;
    }

    // Armamos el cuerpo del mensaje que te llegará al correo
    $cuerpoMensaje = "Has recibido un nuevo mensaje de contacto.\n\n";
    $cuerpoMensaje .= "Detalles del cliente:\n";
    $cuerpoMensaje .= "Nombre: " . $nombre . "\n";
    $cuerpoMensaje .= "Email: " . $email . "\n";
    $cuerpoMensaje .= "Teléfono: " . $telefono . "\n\n";
    
    $cuerpoMensaje .= "Detalles del servicio:\n";
    $cuerpoMensaje .= "Servicio: " . $servicio . "\n";
    $cuerpoMensaje .= "Fecha: " . $fecha . "\n";
    $cuerpoMensaje .= "Hora: " . $hora . "\n";
    $cuerpoMensaje .= "Dirección: " . $direccion . "\n";
    $cuerpoMensaje .= "Trabajo en altura: " . $altura . "\n\n";
    
    $cuerpoMensaje .= "Mensaje:\n" . $mensaje . "\n";

    // Configuramos las cabeceras del correo (Headers)
    $headers = "From: " . $email . "\r\n"; // El remitente es el email de quien llenó el formulario
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n"; // Formato de texto simple

    // Función 'mail' de PHP que realmente envía el correo
    // Retorna 'true' si se envía con éxito a la cola del servidor
    $envioExitoso = mail($destinatario, $asunto, $cuerpoMensaje, $headers);

    if ($envioExitoso) {
        // Si todo salió bien, redirigimos a una página de éxito, o mostramos un mensaje
        echo "<script>alert('¡Mensaje enviado correctamente! Nos pondremos en contacto a la brevedad.'); window.location.href='index.html';</script>";
    } else {
        echo "<script>alert('Hubo un error al enviar el mensaje. Por favor, intenta de nuevo más tarde.'); window.history.back();</script>";
    }
} else {
    // Si alguien intenta entrar a este archivo directamente sin pasar por el formulario
    echo "Acceso denegado.";
}
?>
