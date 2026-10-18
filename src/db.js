const { Pool } = require('pg');
const cfg = require('./config');

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('Falta la variable DATABASE_URL (la dirección de conexión de Neon).');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
    });
    pool.on('error', (error) => console.error('[db]', error.message));
  }
  return pool;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS kioscos (
    id        SERIAL PRIMARY KEY,
    nombre    TEXT NOT NULL,
    salt      TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    activo    BOOLEAN NOT NULL DEFAULT TRUE,
    creado    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_kioscos_nombre_lower ON kioscos (lower(nombre));
  CREATE TABLE IF NOT EXISTS configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS turnos (
    id        SERIAL PRIMARY KEY,
    fecha     TEXT NOT NULL,
    hora      TEXT NOT NULL,
    servicio  TEXT NOT NULL,
    vehiculo  TEXT,
    precio    INTEGER,
    nombre    TEXT NOT NULL,
    telefono  TEXT NOT NULL,
    estado    TEXT NOT NULL DEFAULT 'confirmado' CHECK (estado IN ('confirmado','cancelado','realizado')),
    creado    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_turnos_fecha_hora ON turnos (fecha, hora, estado);
  ALTER TABLE turnos ADD COLUMN IF NOT EXISTS vehiculo TEXT;
  ALTER TABLE turnos ADD COLUMN IF NOT EXISTS precio INTEGER;
  ALTER TABLE turnos ADD COLUMN IF NOT EXISTS patente TEXT;
  ALTER TABLE turnos ADD COLUMN IF NOT EXISTS kiosco_id INTEGER REFERENCES kioscos(id) ON DELETE SET NULL;
  CREATE INDEX IF NOT EXISTS idx_turnos_kiosco_fecha ON turnos (kiosco_id, fecha);
  CREATE TABLE IF NOT EXISTS precios_vehiculos (
    vehiculo TEXT PRIMARY KEY,
    importe  INTEGER NOT NULL CHECK (importe >= 0)
  );
  CREATE TABLE IF NOT EXISTS mensajes (
    id        SERIAL PRIMARY KEY,
    nombre    TEXT NOT NULL,
    telefono  TEXT NOT NULL,
    mensaje   TEXT NOT NULL DEFAULT '',
    creado    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

let listo = null;

function init() {
  if (!listo) {
    listo = (async () => {
      await getPool().query(SCHEMA);
      const client = await getPool().connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['lavadero-turnos-estado']);
        const constraint = await client.query(
          "SELECT pg_get_constraintdef(oid) AS definicion FROM pg_constraint WHERE conrelid = 'turnos'::regclass AND conname = 'turnos_estado_check'"
        );
        if (!constraint.rowCount || !constraint.rows[0].definicion.includes('realizado')) {
          await client.query('ALTER TABLE turnos DROP CONSTRAINT IF EXISTS turnos_estado_check');
          await client.query(
            "ALTER TABLE turnos ADD CONSTRAINT turnos_estado_check CHECK (estado IN ('confirmado','cancelado','realizado'))"
          );
        }
        await client.query('COMMIT');
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch (_) { /* La conexión pudo cerrarse. */ }
        throw error;
      } finally {
        client.release();
      }
      await Promise.all(cfg.VEHICULOS.map(({ id, importe }) =>
        getPool().query(
          'INSERT INTO precios_vehiculos (vehiculo, importe) VALUES ($1, $2) ON CONFLICT (vehiculo) DO NOTHING',
          [id, importe]
        )
      ));
      await getPool().query(
        "INSERT INTO configuracion (clave, valor) VALUES ('cupos', $1) ON CONFLICT (clave) DO NOTHING",
        [String(cfg.CUPOS)]
      );
    })().catch((error) => { listo = null; throw error; });
  }
  return listo;
}

async function query(text, params) {
  await init();
  return getPool().query(text, params);
}

async function obtenerCupos(client) {
  if (!client) await init();
  const result = await (client || getPool()).query(
    "SELECT valor::integer AS cupos FROM configuracion WHERE clave = 'cupos'"
  );
  if (!result.rowCount || !Number.isSafeInteger(result.rows[0].cupos) || result.rows[0].cupos < 1) {
    throw new Error('La cantidad de cupos configurada no es válida.');
  }
  return result.rows[0].cupos;
}

async function actualizarCupos(cupos) {
  await init();
  await getPool().query(
    "INSERT INTO configuracion (clave, valor) VALUES ('cupos', $1) ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor",
    [String(cupos)]
  );
}

async function reservar(turno, hoyStr) {
  await init();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${turno.fecha} ${turno.hora}`]);
    const cupos = await obtenerCupos(client);

    const ocupados = await client.query(
      "SELECT COUNT(*)::int AS n FROM turnos WHERE fecha = $1 AND hora = $2 AND estado = 'confirmado'",
      [turno.fecha, turno.hora]
    );
    if (ocupados.rows[0].n >= cupos) {
      await client.query('ROLLBACK');
      return { error: 'ocupado' };
    }

    let precio = null;
    if (cfg.SERVICIOS_CON_PRECIO.includes(turno.servicio)) {
      const precioResult = await client.query(
        'SELECT importe FROM precios_vehiculos WHERE vehiculo = $1',
        [turno.vehiculo]
      );
      if (!precioResult.rowCount) throw new Error('No se encontró el precio configurado para el vehículo.');
      precio = precioResult.rows[0].importe;
    }

    const digitos = turno.telefono.replace(/\D/g, '');
    const pendientes = await client.query(
      "SELECT COUNT(*)::int AS n FROM turnos WHERE regexp_replace(telefono, '\\D', '', 'g') = $1 AND fecha >= $2 AND estado = 'confirmado'",
      [digitos, hoyStr]
    );
    if (pendientes.rows[0].n >= cfg.MAX_TURNOS_POR_TELEFONO) {
      await client.query('ROLLBACK');
      return { error: 'limite' };
    }

    const result = await client.query(
      'INSERT INTO turnos (fecha, hora, servicio, vehiculo, precio, nombre, telefono, patente, kiosco_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [turno.fecha, turno.hora, turno.servicio, turno.vehiculo, precio, turno.nombre, turno.telefono, turno.patente, turno.kioscoId || null]
    );
    await client.query('COMMIT');
    return { id: result.rows[0].id };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) { /* La conexión pudo cerrarse. */ }
    throw error;
  } finally {
    client.release();
  }
}

async function actualizarPrecios(precios) {
  await init();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    for (const { vehiculo, importe } of precios) {
      await client.query(
        'UPDATE precios_vehiculos SET importe = $1 WHERE vehiculo = $2',
        [importe, vehiculo]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) { /* La conexión pudo cerrarse. */ }
    throw error;
  } finally {
    client.release();
  }
}

async function marcarRealizado(id, importe) {
  await init();
  return getPool().query(
    "UPDATE turnos SET estado = 'realizado', precio = COALESCE(precio, $2::integer) " +
      "WHERE id = $1 AND estado = 'confirmado' AND (precio IS NOT NULL OR $2::integer IS NOT NULL) RETURNING id",
    [id, importe]
  );
}

module.exports = { query, reservar, actualizarCupos, actualizarPrecios, marcarRealizado, obtenerCupos };
