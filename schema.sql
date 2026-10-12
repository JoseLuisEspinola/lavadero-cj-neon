-- Referencia: estas tablas se crean solas en el primer pedido.
-- Si preferís crearlas a mano, pegá esto en el "SQL Editor" de Neon.

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
