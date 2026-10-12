const express = require('express');
const db = require('../db');
const cfg = require('../config');
const { ymd, parseFecha, hoy, minutosAhora, sumarDias } = require('../fechas');
const { limitador } = require('../limit');
const { ah } = require('../util');

const router = express.Router();

// Datos que el sitio necesita para armar el formulario
router.get('/config', (req, res) => {
  res.json({
    servicios: cfg.SERVICIOS,
    diasAdelante: cfg.DIAS_ADELANTE,
    diasAbierto: cfg.DIAS_ABIERTO,
    accesoAdmin: cfg.MOSTRAR_ACCESO_ADMIN,
  });
});

function validarFecha(s) {
  const dt = parseFecha(s);
  if (!dt) return 'Fecha inválida.';
  const desde = hoy();
  const hasta = sumarDias(desde, cfg.DIAS_ADELANTE);
  if (dt < desde) return 'Esa fecha ya pasó.';
  if (dt > hasta) return 'Todavía no tomamos turnos para esa fecha.';
  if (!cfg.DIAS_ABIERTO.includes(dt.getUTCDay())) return 'Ese día estamos cerrados.';
  return null;
}

function horaPasada(fecha, hora) {
  if (fecha !== ymd(hoy())) return false;
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m <= minutosAhora();
}

router.get('/horarios', ah(async (req, res) => {
  const fecha = req.query.fecha;
  const error = validarFecha(fecha);
  if (error) return res.status(400).json({ error });

  const r = await db.query(
    "SELECT hora, COUNT(*)::int AS n FROM turnos WHERE fecha = $1 AND estado = 'confirmado' GROUP BY hora",
    [fecha]
  );
  const ocupados = {};
  r.rows.forEach((x) => { ocupados[x.hora] = x.n; });

  const horarios = cfg.HORAS.map((hora) => ({
    hora,
    libre: !horaPasada(fecha, hora) && (ocupados[hora] || 0) < cfg.CUPOS,
  }));
  res.json({ fecha, horarios });
}));

router.post('/turnos', limitador(15 * 60 * 1000, 10), ah(async (req, res) => {
  const b = req.body || {};
  const servicio = String(b.servicio || '');
  const fecha = String(b.fecha || '');
  const hora = String(b.hora || '');
  const nombre = String(b.nombre || '').trim();
  const telefono = String(b.telefono || '').trim();

  if (!cfg.SERVICIOS.includes(servicio)) return res.status(400).json({ error: 'Elegí un servicio.' });
  const error = validarFecha(fecha);
  if (error) return res.status(400).json({ error });
  if (!cfg.HORAS.includes(hora) || horaPasada(fecha, hora)) {
    return res.status(400).json({ error: 'Ese horario no está disponible.' });
  }
  if (nombre.length < 2 || nombre.length > 60) return res.status(400).json({ error: 'Escribí tu nombre.' });
  if (!/^[0-9+()\s-]{6,20}$/.test(telefono)) return res.status(400).json({ error: 'Revisá tu teléfono.' });

  const r = await db.reservar({ fecha, hora, servicio, nombre, telefono }, ymd(hoy()));
  if (r.error === 'ocupado') return res.status(409).json({ error: 'Ese horario se acaba de ocupar. Elegí otro.' });
  if (r.error === 'limite') {
    return res.status(400).json({
      error: `Ya tenés ${cfg.MAX_TURNOS_POR_TELEFONO} turnos reservados. Esperá a que pasen o llamanos para cambiarlos.`,
    });
  }
  res.status(201).json({ id: r.id, fecha, hora });
}));

module.exports = router;
