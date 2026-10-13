require('dotenv').config();

const app = require('./src/aplicacion');
const cfg = require('./src/config');

if (!process.env.DATABASE_URL) {
  console.warn('[aviso] Falta DATABASE_URL: las reservas y mensajes no van a funcionar.');
}

app.listen(cfg.PORT, () => console.log(`Lavadero CJ funcionando en http://localhost:${cfg.PORT}`));
