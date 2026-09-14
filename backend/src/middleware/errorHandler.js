// Middleware centralizado de manejo de errores
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "P2002") {
    return res.status(409).json({ error: "El recurso ya existe (valor duplicado)." });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Recurso no encontrado." });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Error interno del servidor." });
}

module.exports = { errorHandler };
