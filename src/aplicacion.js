require('dotenv').config();

const path = require('path');
const express = require('express');

const app = express();
const enVercel = !!process.env.VERCEL;

if (enVercel || process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.disable('x-powered-by');

// En Vercel los encabezados de seguridad se definen en vercel.json
if (!enVercel) {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; " +
        "base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
    );
    next();
  });
}

app.use(express.json({ limit: '10kb' }));

app.use('/api', require('./routes/turnos'));
app.use('/api', require('./routes/contacto'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', (req, res) => res.status(404).json({ error: 'No encontrado.' }));

// En Vercel la carpeta public/ la sirve la red de Vercel; local la sirve Express
if (!enVercel) app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Datos inválidos.' });
  console.error(err);
  res.status(500).json({ error: 'Error interno. Probá de nuevo en unos segundos.' });
});

module.exports = app;
