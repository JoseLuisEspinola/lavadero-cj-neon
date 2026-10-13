function limitador(ventanaMs, max) {
  const golpes = new Map();
  setInterval(() => {
    const ahora = Date.now();
    for (const [ip, golpe] of golpes) if (golpe.reinicia < ahora) golpes.delete(ip);
  }, ventanaMs).unref();

  return (req, res, next) => {
    const ahora = Date.now();
    let golpe = golpes.get(req.ip);
    if (!golpe || golpe.reinicia < ahora) {
      golpe = { n: 0, reinicia: ahora + ventanaMs };
      golpes.set(req.ip, golpe);
    }
    golpe.n++;
    if (golpe.n > max) return res.status(429).json({ error: 'Demasiados intentos. Probá de nuevo más tarde.' });
    next();
  };
}

module.exports = { limitador };
