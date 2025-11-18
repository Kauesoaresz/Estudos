module.exports = {
  ensureAuth(req, res, next) {
    if (req.session && req.session.usuario) {
      return next();
    }
    return res.redirect("/login");
  },

  injectUser(req, res, next) {
    res.locals.usuarioLogado = null;

    if (req.session && req.session.usuario) {
      res.locals.usuarioLogado = req.session.usuario;  
    }

    next();
  }
};
