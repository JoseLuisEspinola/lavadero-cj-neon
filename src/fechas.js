// Fechas siempre en hora de Argentina, sin depender de la zona horaria del servidor
// (en Vercel el servidor usa otra). Las fechas "sin hora" se manejan como UTC a medianoche.
const TZ = 'America/Argentina/Buenos_Aires';
const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function ahora() {
  const o = {};
  for (const p of fmt.formatToParts(new Date())) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, min: +o.minute };
}

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

function parseFecha(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

function hoy() {
  const a = ahora();
  return new Date(Date.UTC(a.y, a.m - 1, a.d));
}

function minutosAhora() {
  const a = ahora();
  return a.h * 60 + a.min;
}

function sumarDias(d, n) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

module.exports = { ymd, parseFecha, hoy, minutosAhora, sumarDias };
