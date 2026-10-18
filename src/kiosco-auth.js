const crypto = require('crypto');
const { promisify } = require('util');
const db = require('./db');

const scrypt = promisify(crypto.scrypt);
const DURACION = 8 * 60 * 60 * 1000;
const SECRET = process.env.SESSION_SECRET || '';

function leerCookie(req, nombre) {
  const cookies = (req.headers.cookie || '').split(';');
  for (const cookie of cookies) {
    const index = cookie.indexOf('=');
    if (index > 0 && cookie.slice(0, index).trim() === nombre) {
      return cookie.slice(index + 1).trim();
    }
  }
  return null;
}

function firmar(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

async function crearPasswordHash(password, salt) {
  return (await scrypt(password, Buffer.from(salt, 'hex'), 64)).toString('hex');
}

function comparar(a, b) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
}

async function sesionDesdeRequest(req) {
  const token = leerCookie(req, 'kiosco');
  if (!token) return null;
  const [idValue, exp, firma] = token.split('.');
  const id = Number(idValue);
  if (!Number.isSafeInteger(id) || id < 1 || !exp || !firma ||
      !Number.isSafeInteger(Number(exp)) || Number(exp) < Date.now() ||
      SECRET.length < 16 || !comparar(firma, firmar(`${id}.${exp}`))) {
    req.cookiesInvalidKiosco = true;
    return null;
  }
  const result = await db.query(
    'SELECT id, nombre FROM kioscos WHERE id = $1 AND activo = TRUE',
    [id]
  );
  if (!result.rowCount) {
    req.cookiesInvalidKiosco = true;
    return null;
  }
  return result.rows[0];
}

function crearCookie(id) {
  const exp = String(Date.now() + DURACION);
  const value = `${id}.${exp}`;
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : '';
  return `kiosco=${value}.${firmar(value)}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${DURACION / 1000}${secure}`;
}

function borrarCookie() {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : '';
  return `kiosco=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${secure}`;
}

module.exports = {
  crearCookie,
  borrarCookie,
  crearPasswordHash,
  sesionDesdeRequest,
  DURACION,
};
