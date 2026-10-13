const crypto = require('crypto');
const express = require('express');
const db = require('../db');
const cfg = require('../config');
const { ymd, hoy, parseFecha } = require('../fechas');
const { limitador } = require('../limit');
const { ah } = require('../util');

const router = express.Router();
const PASSWORD = process.env.ADMIN_PASSWORD || '';
const SECRET = process.env.SESSION_SECRET || '';
const habilitado = PASSWORD.length >= 8 && SECRET.length >= 16;

if (!habilitado) {
  console.warn('[admin] Panel deshabilitado: configurá ADMIN_PASSWORD (8+) y SESSION_SECRET (16+) en variables de entorno.');
}

const DURACION = 8 * 60 * 60 * 1000;
const firmar = (value) => crypto.createHmac('sha256', SECRET).update(value).digest('hex');
const sha = (value) => crypto.createHash('sha256').update(value).digest();

function leerCookies(req) {
  const cookies = {};
  (req.headers.cookie || '').split(';').forEach((part) => {
    const index = part.indexOf('=');
    if (index > 0) cookies[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  });
  return cookies;
}

function sesionValida(req) {
  const token = leerCookies(req).admin;
  if (!token) return false;
  const [exp, firma] = token.split('.');
  if (!exp || !firma || Number(exp) < Date.now()) return false;
  const a = Buffer.from(firma);
  const b = Buffer.from(firmar(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requiereAdmin(req, res, next) {
  if (!habilitado) return res.status(503).json({ error: 'El panel no está configurado.' });
  if (!sesionValida(req)) return res.status(401).json({ error: 'No autorizado.' });
  next();
}

const cookieBase = 'HttpOnly; SameSite=Strict; Path=/api/admin';
const seguro = () => (process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : '');

router.post('/login', limitador(15 * 60 * 1000, 10), (req, res) => {
  if (!habilitado) return res.status(503).json({ error: 'El panel no está configurado.' });
  const clave = String((req.body || {}).password || '');
  if (!crypto.timingSafeEqual(sha(clave), sha(PASSWORD))) {
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  }
  const exp = String(Date.now() + DURACION);
  res.setHeader('Set-Cookie', `admin=${exp}.${firmar(exp)}; ${cookieBase}; Max-Age=${DURACION / 1000}${seguro()}`);
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', `admin=; ${cookieBase}; Max-Age=0${seguro()}`);
  res.json({ ok: true });
});

router.get('/sesion', (req, res) => res.json({ activa: habilitado && sesionValida(req), habilitado }));

router.get('/turnos', requiereAdmin, ah(async (req, res) => {
  const desde = req.query.desde || ymd(hoy());
  const hasta = req.query.hasta || null;
  if (!parseFecha(desde) || (hasta && !parseFecha(hasta)) ||
      (hasta && hasta < desde)) {
    return res.status(400).json({ error: 'Revisá el rango de fechas.' });
  }
  const result = await db.query(
    'SELECT id, fecha, hora, servicio, vehiculo, precio, nombre, telefono, estado FROM turnos WHERE fecha >= $1 AND ($2::text IS NULL OR fecha <= $2) ORDER BY fecha, hora, id',
    [desde, hasta]
  );
  res.json(result.rows.map((row) => {
    const vehiculo = cfg.VEHICULOS.find((item) => item.id === row.vehiculo);
    return Object.assign({}, row, { vehiculo: vehiculo ? vehiculo.nombre : row.vehiculo });
  }));
}));

router.get('/precios', requiereAdmin, ah(async (req, res) => {
  const result = await db.query(
    'SELECT v.id AS vehiculo, v.nombre, p.importe FROM (VALUES ' +
      cfg.VEHICULOS.map((_, index) => `($${index * 2 + 1}::text, $${index * 2 + 2}::text)`).join(', ') +
      ') AS v(id, nombre) LEFT JOIN precios_vehiculos p ON p.vehiculo = v.id',
    cfg.VEHICULOS.flatMap(({ id, nombre }) => [id, nombre])
  );
  if (result.rows.some((row) => row.importe === null)) {
    throw new Error('Falta un precio configurado para un tipo de vehículo.');
  }
  res.json(result.rows);
}));

router.put('/precios', requiereAdmin, ah(async (req, res) => {
  const precios = req.body && req.body.precios;
  if (!Array.isArray(precios) || precios.length !== cfg.VEHICULOS.length) {
    return res.status(400).json({ error: 'Enviá un importe para cada tipo de vehículo.' });
  }
  const ids = new Set(cfg.VEHICULOS.map(({ id }) => id));
  const recibidos = new Set();
  for (const precio of precios) {
    if (!precio || !ids.has(precio.vehiculo) || recibidos.has(precio.vehiculo) ||
        !Number.isSafeInteger(precio.importe) || precio.importe < 0 || precio.importe > 1000000000) {
      return res.status(400).json({ error: 'Revisá los importes: deben ser pesos enteros entre 0 y 1.000.000.000.' });
    }
    recibidos.add(precio.vehiculo);
  }
  await db.actualizarPrecios(precios);
  res.json({ ok: true });
}));

router.post('/turnos/:id/realizado', requiereAdmin, ah(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Turno inválido.' });
  const body = req.body || {};
  const importe = body.importe;
  if (importe !== undefined &&
      (!Number.isSafeInteger(importe) || importe < 0 || importe > 1000000000)) {
    return res.status(400).json({ error: 'El importe cobrado debe ser un número entero entre 0 y 1.000.000.000.' });
  }
  const result = await db.marcarRealizado(id, importe === undefined ? null : importe);
  if (!result.rowCount) {
    return res.status(409).json({
      error: importe === undefined
        ? 'Este turno no tiene un importe guardado. Indicá cuánto se cobró para marcarlo como realizado.'
        : 'El turno ya no está pendiente o no existe.',
    });
  }
  res.json({ ok: true });
}));

router.delete('/turnos/:id', requiereAdmin, ah(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Turno inválido.' });
  const result = await db.query("UPDATE turnos SET estado = 'cancelado' WHERE id = $1 AND estado = 'confirmado'", [id]);
  res.json({ ok: result.rowCount > 0 });
}));

router.get('/mensajes', requiereAdmin, ah(async (req, res) => {
  const result = await db.query(
    "SELECT id, nombre, telefono, mensaje, to_char(creado AT TIME ZONE 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD HH24:MI') AS creado FROM mensajes ORDER BY id DESC LIMIT 100"
  );
  res.json(result.rows);
}));

module.exports = router;
