const Anotacao = require("../models/Anotacao");
const MarkdownIt = require("markdown-it");

// Inicializa o markdown-it com quebras de linha ativadas
const md = new MarkdownIt({
  breaks: true
});

// ========================
// LISTAR ANOTAÇÕES
// ========================
exports.listar = async (req, res) => {

  const anotacoesBrutas = await Anotacao.findAll({
    order: [
      ["importante", "DESC"], // importantes primeiro
      ["data", "DESC"]
    ]
  });

  // Converte o markdown ANTES de enviar para o EJS
  const anotacoes = anotacoesBrutas.map(a => {
    return {
      ...a.dataValues,
      html: md.render(a.conteudo) // cria o HTML final
    };
  });

  res.render("anotacoes/lista", {
    tituloPagina: "Anotações",
    anotacoes
  });
};

// ========================
// FORMULÁRIO NOVA
// ========================
exports.formAdicionar = (req, res) => {
  res.render("anotacoes/form", {
    tituloPagina: "Nova Anotação",
    anotacao: null
  });
};

// ========================
// SALVAR NOVA
// ========================
exports.salvar = async (req, res) => {
  const { data, conteudo } = req.body;
  const importante = req.body.importante === "on";

  await Anotacao.create({
    data,
    conteudo,
    importante
  });

  res.redirect("/anotacoes");
};

// ========================
// FORMULÁRIO EDITAR
// ========================
exports.formEditar = async (req, res) => {
  const anotacao = await Anotacao.findByPk(req.params.id);

  res.render("anotacoes/form", {
    tituloPagina: "Editar Anotação",
    anotacao
  });
};

// ========================
// ATUALIZAR
// ========================
exports.atualizar = async (req, res) => {
  const { data, conteudo } = req.body;
  const importante = req.body.importante === "on";

  await Anotacao.update(
    { data, conteudo, importante },
    { where: { id: req.params.id } }
  );

  res.redirect("/anotacoes");
};

// ========================
// EXCLUIR
// ========================
exports.excluir = async (req, res) => {
  await Anotacao.destroy({
    where: { id: req.params.id }
  });

  res.redirect("/anotacoes");
};
