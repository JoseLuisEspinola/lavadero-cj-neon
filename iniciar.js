// Para probar en tu computadora: npm start
const app = require('./src/aplicacion');
const cfg = require('./src/config');

if (!process.env.DATABASE_URL) {
  console.warn('[aviso] Falta DATABASE_URL en el archivo .env: la página abre, pero las reservas no van a funcionar.');
}
app.listen(cfg.PORT, () => console.log(`Lavadero CJ funcionando en http://localhost:${cfg.PORT}`));
