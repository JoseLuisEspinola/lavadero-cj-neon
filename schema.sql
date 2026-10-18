-- Estas tablas se crean automáticamente al primer uso de la API.
-- También podés ejecutar este archivo manualmente en el SQL Editor de Neon.

CREATE TABLE IF NOT EXISTS kioscos (
  id            SERIAL PRIMARY KEY,
  nombre        TEXT NOT NULL,
  salt          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  creado        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kioscos_nombre_lower ON kioscos (lower(nombre));

CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
INSERT INTO configuracion (clave, valor) VALUES ('cupos', '2')
ON CONFLICT (clave) DO NOTHING;

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
ALTER TABLE turnos DROP CONSTRAINT IF EXISTS turnos_estado_check;
ALTER TABLE turnos ADD CONSTRAINT turnos_estado_check CHECK (estado IN ('confirmado','cancelado','realizado'));

CREATE TABLE IF NOT EXISTS precios_vehiculos (
  vehiculo TEXT PRIMARY KEY,
  importe  INTEGER NOT NULL CHECK (importe >= 0)
);
INSERT INTO precios_vehiculos (vehiculo, importe) VALUES
  ('auto-app', 15000),
  ('sedan', 20000),
  ('utilitario-suv', 25000),
  ('pickup', 30000),
  ('camion', 45000)
ON CONFLICT (vehiculo) DO NOTHING;

CREATE TABLE IF NOT EXISTS mensajes (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL,
  telefono  TEXT NOT NULL,
  mensaje   TEXT NOT NULL DEFAULT '',
  creado    TIMESTAMPTZ NOT NULL DEFAULT now()
);
