module.exports = {

  ensureAuth(req, res, next) {
    // NOVO: sessão correta
    if (req.session && req.session.usuario) {
      return next();
    }
    return res.redirect("/login");
  },

  injectUser(req, res, next) {
    // NOVO: popula usuarioLogado para o header
    res.locals.usuarioLogado = req.session.usuario || null;
    next();
  }

};
