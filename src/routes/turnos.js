const express = require('express');
const db = require('../db');
const cfg = require('../config');
const { ymd, parseFecha, hoy, minutosAhora, sumarDias } = require('../fechas');
const { limitador } = require('../limit');
const { ah } = require('../util');

const router = express.Router();

router.get('/config', ah(async (req, res) => {
  const result = await db.query('SELECT vehiculo, importe FROM precios_vehiculos');
  const precios = Object.fromEntries(result.rows.map((row) => [row.vehiculo, row.importe]));
  res.json({
    servicios: cfg.SERVICIOS,
    serviciosConPrecio: cfg.SERVICIOS_CON_PRECIO,
    vehiculos: cfg.VEHICULOS.map(({ id, nombre }) => ({ id, nombre })),
    precios,
    diasAdelante: cfg.DIAS_ADELANTE,
    diasAbierto: cfg.DIAS_ABIERTO,
  });
}));

function validarFecha(value) {
  const date = parseFecha(value);
  if (!date) return 'Fecha inválida.';
  const desde = hoy();
  const hasta = sumarDias(desde, cfg.DIAS_ADELANTE);
  if (date < desde) return 'Esa fecha ya pasó.';
  if (date > hasta) return 'Todavía no tomamos turnos para esa fecha.';
  if (!cfg.DIAS_ABIERTO.includes(date.getUTCDay())) return 'Ese día estamos cerrados.';
  return null;
}

function horaPasada(fecha, hora) {
  if (fecha !== ymd(hoy())) return false;
  const [hours, minutes] = hora.split(':').map(Number);
  return hours * 60 + minutes <= minutosAhora();
}

router.get('/horarios', ah(async (req, res) => {
  const fecha = req.query.fecha;
  const error = validarFecha(fecha);
  if (error) return res.status(400).json({ error });

  const result = await db.query(
    "SELECT hora, COUNT(*)::int AS n FROM turnos WHERE fecha = $1 AND estado = 'confirmado' GROUP BY hora",
    [fecha]
  );
  const ocupados = {};
  result.rows.forEach((row) => { ocupados[row.hora] = row.n; });

  res.json({
    fecha,
    horarios: cfg.HORAS.map((hora) => ({
      hora,
      libre: !horaPasada(fecha, hora) && (ocupados[hora] || 0) < cfg.CUPOS,
    })),
  });
}));

router.post('/turnos', limitador(15 * 60 * 1000, 10), ah(async (req, res) => {
  const body = req.body || {};
  const servicio = String(body.servicio || '');
  const vehiculo = String(body.vehiculo || '');
  const fecha = String(body.fecha || '');
  const hora = String(body.hora || '');
  const nombre = String(body.nombre || '').trim();
  const telefono = String(body.telefono || '').trim();

  if (!cfg.SERVICIOS.includes(servicio)) return res.status(400).json({ error: 'Elegí un servicio.' });
  if (!cfg.VEHICULOS.some((item) => item.id === vehiculo)) {
    return res.status(400).json({ error: 'Elegí un tipo de vehículo.' });
  }
  const error = validarFecha(fecha);
  if (error) return res.status(400).json({ error });
  if (!cfg.HORAS.includes(hora) || horaPasada(fecha, hora)) {
    return res.status(400).json({ error: 'Ese horario no está disponible.' });
  }
  if (nombre.length < 2 || nombre.length > 60) return res.status(400).json({ error: 'Escribí tu nombre.' });
  if (!/^[0-9+()\s-]{6,20}$/.test(telefono)) return res.status(400).json({ error: 'Revisá tu teléfono.' });

  const result = await db.reservar({ fecha, hora, servicio, vehiculo, nombre, telefono }, ymd(hoy()));
  if (result.error === 'ocupado') return res.status(409).json({ error: 'Ese horario se acaba de ocupar. Elegí otro.' });
  if (result.error === 'limite') {
    return res.status(400).json({
      error: `Ya tenés ${cfg.MAX_TURNOS_POR_TELEFONO} turnos reservados. Esperá a que pasen o llamanos para cambiarlos.`,
    });
  }
  res.status(201).json({ id: result.id, fecha, hora });
}));

module.exports = router;
