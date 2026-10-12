// Todo lo que el lavadero puede querer cambiar está acá.
module.exports = {
  PORT: Number(process.env.PORT) || 3000,

  // Horarios de turno (uno por hora). Editá la lista a gusto.
  HORAS: ['08:00','09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'],

  // Días abiertos: 0 = domingo, 1 = lunes ... 6 = sábado
  DIAS_ABIERTO: [1, 2, 3, 4, 5, 6],

  // Cuántos autos se atienden a la vez en cada horario
  CUPOS: Number(process.env.CUPOS) || 1,

  // Con cuántos días de anticipación se puede reservar
  DIAS_ADELANTE: 30,

  // Máximo de turnos pendientes por teléfono (frena el abuso del formulario)
  MAX_TURNOS_POR_TELEFONO: 4,

  // Muestra al entrar la ventana "Soy cliente / Soy administrador".
  // Con MOSTRAR_ACCESO_ADMIN=false solo aparece si abrís la página con /?admin
  MOSTRAR_ACCESO_ADMIN: process.env.MOSTRAR_ACCESO_ADMIN !== 'false',

  SERVICIOS: [
    'Lavado exterior',
    'Lavado completo',
    'Limpieza de tapizados',
    'Encerado y pulido',
    'Lavado de motor',
    'Tratamiento acrílico',
    'Tratamiento de cristales',
  ],
};
