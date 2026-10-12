// Limitador simple en memoria: máximo "max" pedidos por IP cada "ventanaMs".
function limitador(ventanaMs, max) {
  const golpes = new Map();
  setInterval(() => {
    const ahora = Date.now();
    for (const [ip, g] of golpes) if (g.reinicia < ahora) golpes.delete(ip);
  }, ventanaMs).unref();

  return (req, res, next) => {
    const ahora = Date.now();
    let g = golpes.get(req.ip);
    if (!g || g.reinicia < ahora) {
      g = { n: 0, reinicia: ahora + ventanaMs };
      golpes.set(req.ip, g);
    }
    g.n++;
    if (g.n > max) return res.status(429).json({ error: 'Demasiados intentos. Probá de nuevo más tarde.' });
    next();
  };
}

module.exports = { limitador };
