const TZ = 'America/Argentina/Buenos_Aires';
const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function ahora() {
  const parts = {};
  for (const part of fmt.formatToParts(new Date())) parts[part.type] = part.value;
  return { y: +parts.year, m: +parts.month, d: +parts.day, h: +parts.hour % 24, min: +parts.minute };
}

const pad = (n) => String(n).padStart(2, '0');
const ymd = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

function parseFecha(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function hoy() {
  const date = ahora();
  return new Date(Date.UTC(date.y, date.m - 1, date.d));
}

function minutosAhora() {
  const date = ahora();
  return date.h * 60 + date.min;
}

function sumarDias(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

module.exports = { ymd, parseFecha, hoy, minutosAhora, sumarDias };
