const express = require('express');
const db = require('../db');
const { limitador } = require('../limit');
const { ah } = require('../util');

const router = express.Router();

router.post('/mensajes', limitador(15 * 60 * 1000, 5), ah(async (req, res) => {
  const body = req.body || {};
  const nombre = String(body.nombre || '').trim();
  const telefono = String(body.telefono || '').trim();
  const mensaje = String(body.mensaje || '').trim();

  if (nombre.length < 2 || nombre.length > 60) return res.status(400).json({ error: 'Escribí tu nombre.' });
  if (!/^[0-9+()\s-]{6,20}$/.test(telefono)) return res.status(400).json({ error: 'Revisá tu teléfono.' });
  if (mensaje.length > 1000) return res.status(400).json({ error: 'El mensaje es demasiado largo.' });

  await db.query('INSERT INTO mensajes (nombre, telefono, mensaje) VALUES ($1, $2, $3)', [nombre, telefono, mensaje]);
  res.status(201).json({ ok: true });
}));

module.exports = router;
