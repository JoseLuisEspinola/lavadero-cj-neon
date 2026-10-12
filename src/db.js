const { Pool } = require('pg');
const cfg = require('./config');

let pool = null;
function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('Falta la variable DATABASE_URL (la dirección de conexión de Neon).');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000, // Neon puede tardar unos segundos en despertar
    });
    pool.on('error', (e) => console.error('[db]', e.message));
  }
  return pool;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS turnos (
    id        SERIAL PRIMARY KEY,
    fecha     TEXT NOT NULL,
    hora      TEXT NOT NULL,
    servicio  TEXT NOT NULL,
    nombre    TEXT NOT NULL,
    telefono  TEXT NOT NULL,
    estado    TEXT NOT NULL DEFAULT 'confirmado' CHECK (estado IN ('confirmado','cancelado')),
    creado    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_turnos_fecha_hora ON turnos (fecha, hora, estado);
  CREATE TABLE IF NOT EXISTS mensajes (
    id        SERIAL PRIMARY KEY,
    nombre    TEXT NOT NULL,
    telefono  TEXT NOT NULL,
    mensaje   TEXT NOT NULL DEFAULT '',
    creado    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

// Crea las tablas la primera vez que hace falta
let listo = null;
function init() {
  if (!listo) {
    listo = getPool().query(SCHEMA).catch((e) => { listo = null; throw e; });
  }
  return listo;
}

async function query(text, params) {
  await init();
  return getPool().query(text, params);
}

// Reserva un turno. Todo ocurre dentro de una transacción con un candado por fecha y hora:
// dos clientes que reservan al mismo tiempo no pueden quedarse con el mismo lugar.
// Devuelve { id } o { error: 'ocupado' | 'limite' }.
async function reservar(t, hoyStr) {
  await init();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${t.fecha} ${t.hora}`]);

    const ocupados = await client.query(
      "SELECT COUNT(*)::int AS n FROM turnos WHERE fecha = $1 AND hora = $2 AND estado = 'confirmado'",
      [t.fecha, t.hora]
    );
    if (ocupados.rows[0].n >= cfg.CUPOS) {
      await client.query('ROLLBACK');
      return { error: 'ocupado' };
    }

    const digitos = t.telefono.replace(/\D/g, '');
    const pendientes = await client.query(
      "SELECT COUNT(*)::int AS n FROM turnos WHERE regexp_replace(telefono, '\\D', '', 'g') = $1 AND fecha >= $2 AND estado = 'confirmado'",
      [digitos, hoyStr]
    );
    if (pendientes.rows[0].n >= cfg.MAX_TURNOS_POR_TELEFONO) {
      await client.query('ROLLBACK');
      return { error: 'limite' };
    }

    const r = await client.query(
      'INSERT INTO turnos (fecha, hora, servicio, nombre, telefono) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [t.fecha, t.hora, t.servicio, t.nombre, t.telefono]
    );
    await client.query('COMMIT');
    return { id: r.rows[0].id };
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) { /* ya estaba cerrada */ }
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { query, reservar };
