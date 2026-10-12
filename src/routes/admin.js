const crypto = require('crypto');
const express = require('express');
const db = require('../db');
const { ymd, hoy } = require('../fechas');
const { limitador } = require('../limit');
const { ah } = require('../util');

const router = express.Router();

const PASSWORD = process.env.ADMIN_PASSWORD || '';
const SECRET = process.env.SESSION_SECRET || '';
const habilitado = PASSWORD.length >= 8 && SECRET.length >= 16;
if (!habilitado) {
  console.warn('[admin] Panel deshabilitado: definí ADMIN_PASSWORD (8+ caracteres) y SESSION_SECRET (16+) en el archivo .env');
}

const DURACION = 8 * 60 * 60 * 1000; // la sesión dura 8 horas
const firmar = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('hex');
const sha = (v) => crypto.createHash('sha256').update(v).digest();

function leerCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return out;
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
const seguro = () => (process.env.NODE_ENV === 'production' ? '; Secure' : '');

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
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(req.query.desde || '') ? req.query.desde : ymd(hoy());
  const r = await db.query(
    'SELECT id, fecha, hora, servicio, nombre, telefono, estado FROM turnos WHERE fecha >= $1 ORDER BY fecha, hora, id',
    [desde]
  );
  res.json(r.rows);
}));

router.delete('/turnos/:id', requiereAdmin, ah(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Turno inválido.' });
  const r = await db.query("UPDATE turnos SET estado = 'cancelado' WHERE id = $1 AND estado = 'confirmado'", [id]);
  res.json({ ok: r.rowCount > 0 });
}));

router.get('/mensajes', requiereAdmin, ah(async (req, res) => {
  const r = await db.query(
    "SELECT id, nombre, telefono, mensaje, to_char(creado AT TIME ZONE 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD HH24:MI') AS creado FROM mensajes ORDER BY id DESC LIMIT 100"
  );
  res.json(r.rows);
}));

module.exports = router;
