const crypto = require('crypto');
const express = require('express');
const db = require('../db');
const { limitador } = require('../limit');
const { ah } = require('../util');
const {
  crearCookie,
  borrarCookie,
  crearPasswordHash,
  sesionDesdeRequest,
} = require('../kiosco-auth');

const router = express.Router();

router.post('/login', limitador(15 * 60 * 1000, 10), ah(async (req, res) => {
  if ((process.env.SESSION_SECRET || '').length < 16) {
    return res.status(503).json({ error: 'El acceso de kioscos no está configurado.' });
  }
  const body = req.body || {};
  const nombre = String(body.nombre || '').trim();
  const password = String(body.password || '');
  if (nombre.length > 80 || password.length > 200) {
    return res.status(401).json({ error: 'Nombre de kiosco o contraseña incorrectos.' });
  }
  const result = await db.query(
    'SELECT id, salt, password_hash FROM kioscos WHERE lower(nombre) = lower($1) AND activo = TRUE',
    [nombre]
  );
  const salt = result.rowCount ? result.rows[0].salt : '00000000000000000000000000000000';
  const hash = await crearPasswordHash(password, salt);
  const storedHash = result.rowCount ? String(result.rows[0].password_hash) : '';
  if (!result.rowCount || !/^[a-f0-9]{128}$/i.test(storedHash) ||
      !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash))) {
    return res.status(401).json({ error: 'Nombre de kiosco o contraseña incorrectos.' });
  }
  res.setHeader('Set-Cookie', crearCookie(result.rows[0].id));
  res.json({ ok: true });
}));

router.get('/sesion', ah(async (req, res) => {
  const kiosco = await sesionDesdeRequest(req);
  res.json({ activa: Boolean(kiosco), nombre: kiosco ? kiosco.nombre : null });
}));

router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', borrarCookie());
  res.json({ ok: true });
});

module.exports = router;
