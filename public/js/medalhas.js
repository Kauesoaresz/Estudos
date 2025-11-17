// ===============================
// ESTADO GLOBAL DO MODAL
// ===============================
let medalhasNovasLista = [];
let medalhaAtualIndex = 0;

// ===============================
// FUNÇÃO — Atualizar conteúdo do modal
// ===============================
function atualizarModalMedalha() {
  const modal = document.getElementById("modal-medalha");
  if (!modal) return;

  if (!Array.isArray(medalhasNovasLista) || medalhasNovasLista.length === 0) {
    fecharModalMedalha();
    return;
  }

  const medalha = medalhasNovasLista[medalhaAtualIndex];
  if (!medalha) {
    fecharModalMedalha();
    return;
  }

  // Elementos
  const nomeEl = document.getElementById("modal-medalha-nome");
  const descEl = document.getElementById("modal-medalha-desc");
  const catEl = document.getElementById("modal-medalha-categoria");
  const iconEl = document.getElementById("modal-medalha-icon");
  const rarEl = document.getElementById("modal-medalha-raridade");
  const idxEl = document.getElementById("modal-medalha-indice");
  const totalEl = document.getElementById("modal-medalha-total");
  const btnProx = document.getElementById("modalMedalhaProxima");

  if (nomeEl) nomeEl.textContent = medalha.nome || "Nova medalha desbloqueada!";
  if (descEl) descEl.textContent = medalha.descricao || "";
  if (catEl) catEl.textContent = medalha.categoria || "";
  if (iconEl) iconEl.textContent = medalha.icone || "🏆";

  // ===============================
  // RARIDADE
  // ===============================
  if (rarEl) {
    rarEl.className = "modal-medalha-raridade-badge";

    const rar = medalha.raridade || "comum";

    if (rar === "comum") {
      rarEl.textContent = "COMUM";
      rarEl.classList.add("badge-raridade-comum");
    } else if (rar === "raro") {
      rarEl.textContent = "RARO";
      rarEl.classList.add("badge-raridade-raro");
    } else if (rar === "epico") {
      rarEl.textContent = "ÉPICO";
      rarEl.classList.add("badge-raridade-epico");
    } else if (rar === "lendario") {
      rarEl.textContent = "LENDÁRIO";
      rarEl.classList.add("badge-raridade-lendario");
    }
  }

  // Contagem (ex: 1 de 12)
  if (idxEl) idxEl.textContent = medalhaAtualIndex + 1;
  if (totalEl) totalEl.textContent = medalhasNovasLista.length;

  // "Próxima" muda para "Ok" no final
  if (btnProx) {
    btnProx.textContent =
      medalhaAtualIndex === medalhasNovasLista.length - 1
        ? "Ok"
        : "Próxima";
  }

  // Exibir modal e travar página
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

// ===============================
// ABRIR MODAL
// ===============================
function abrirModalMedalhas(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return;

  medalhasNovasLista = lista;
  medalhaAtualIndex = 0;
  atualizarModalMedalha();
}

// ===============================
// FECHAR MODAL
// ===============================
function fecharModalMedalha() {
  const modal = document.getElementById("modal-medalha");
  if (!modal) return;

  modal.classList.add("hidden");
  document.body.classList.remove("modal-open");

  medalhasNovasLista = [];
  medalhaAtualIndex = 0;
}

// ===============================
// EVENTOS DO MODAL
// ===============================
function initModalMedalhaEventos() {
  const modal = document.getElementById("modal-medalha");
  if (!modal) return;

  const btnFechar = document.getElementById("modalMedalhaFechar");
  const btnPular = document.getElementById("modalMedalhaPular");
  const btnProx = document.getElementById("modalMedalhaProxima");
  const backdrop = modal.querySelector(".modal-medalha-backdrop");

  if (btnFechar) btnFechar.onclick = fecharModalMedalha;
  if (btnPular) btnPular.onclick = fecharModalMedalha;

  if (btnProx) {
    btnProx.onclick = () => {
      if (medalhaAtualIndex < medalhasNovasLista.length - 1) {
        medalhaAtualIndex++;
        atualizarModalMedalha();
      } else {
        fecharModalMedalha();
      }
    };
  }

  // Clicar fora fecha
  if (backdrop) {
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) fecharModalMedalha();
    });
  }

  // ESC fecha
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") fecharModalMedalha();
  });
}

// ===============================
// DESTACAR PRIMEIRA MEDALHA NOVA
// ===============================
function destacarPrimeiraMedalhaNova(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return;

  const primeira = lista[0];
  if (!primeira?.id) return;

  const card = document.querySelector(`[data-medalha-id="${primeira.id}"]`);
  if (!card) return;

  card.classList.add("medalha-nova");
  card.scrollIntoView({ behavior: "smooth", block: "center" });

  setTimeout(() => card.classList.remove("medalha-nova"), 6500);
}

// ===============================
// FILTROS / ABAS
// ===============================
function aplicarFiltroMedalhas(tipo) {
  const cards = document.querySelectorAll(".medalhas-grid .medalha-card");

  cards.forEach((card) => {
    const conquistada = card.getAttribute("data-conquistada") === "1";
    const raridade = card.getAttribute("data-raridade");

    let mostra = true;

    if (tipo === "conquistadas") mostra = conquistada;
    else if (tipo === "pendentes") mostra = !conquistada;
    else if (tipo === "raras") mostra = raridade === "epico" || raridade === "lendario";

    card.style.display = mostra ? "" : "none";
  });
}

// ===============================
// INICIALIZAÇÃO GERAL
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  initModalMedalhaEventos();

  // Abrir modal automaticamente se houver novas medalhas
  const lista = window.novasMedalhas || [];
  if (lista.length > 0) {
    abrirModalMedalhas(lista);
    destacarPrimeiraMedalhaNova(lista);
  }

  // Abas
  const tabs = document.querySelectorAll(".medalhas-tab");
  if (tabs.length > 0) {
    aplicarFiltroMedalhas("todas");

    tabs.forEach((tab) =>
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        aplicarFiltroMedalhas(tab.dataset.tab);
      })
    );
  }
});
