// ===============================
// KAUE STUDY TRACKER – ROTINA JS
// Menu ⋮ + duplicar para vários dias
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const menuButtons = document.querySelectorAll(".routine-menu-btn");
  const menus = document.querySelectorAll(".routine-menu");
  const dupPanels = document.querySelectorAll(".routine-dup-panel");

  // Fecha todos os menus
  function closeAllMenus() {
    menus.forEach(m => m.classList.remove("open"));
  }

  // Fecha todos os painéis de duplicação
  function closeAllDupPanels() {
    dupPanels.forEach(p => p.classList.remove("open"));
  }

  // Clique no botão ⋮
  menuButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.blockId;
      const menu = document.querySelector(`.routine-menu[data-menu-for="${id}"]`);

      if (!menu) return;

      const isOpen = menu.classList.contains("open");
      closeAllMenus();
      closeAllDupPanels();

      if (!isOpen) {
        menu.classList.add("open");
      }
    });
  });

  // Clique em "Editar"
  document.querySelectorAll(".js-menu-edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.editUrl;
      if (url) {
        window.location.href = url;
      }
    });
  });

  // Clique em "Duplicar…" → abre painel
  document.querySelectorAll(".js-menu-dup").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAllMenus();

      const id = btn.dataset.blockId;
      const panel = document.querySelector(`.routine-dup-panel[data-dup-for="${id}"]`);
      if (!panel) return;

      const alreadyOpen = panel.classList.contains("open");
      closeAllDupPanels();
      if (!alreadyOpen) {
        panel.classList.add("open");
      }
    });
  });

  // Impede que clique dentro do painel FECH E o painel
  dupPanels.forEach(panel => {
    panel.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  });

  // Botão "Cancelar" dentro do painel
  document.querySelectorAll(".dup-cancel").forEach(btn => {
    btn.addEventListener("click", () => {
      const panel = btn.closest(".routine-dup-panel");
      if (panel) panel.classList.remove("open");
    });
  });

  // Antes de enviar duplicação, monta lista de dias
  document.querySelectorAll(".dup-form").forEach(form => {
    form.addEventListener("submit", (e) => {
      const panel = form.closest(".routine-dup-panel");
      if (!panel) return;

      const checkboxes = panel.querySelectorAll('input[type="checkbox"]:not([disabled])');
      const selected = Array.from(checkboxes)
        .filter(c => c.checked)
        .map(c => c.value);

      if (selected.length === 0) {
        e.preventDefault();
        alert("Selecione pelo menos um dia para duplicar.");
        return;
      }

      const hidden = form.querySelector('input[name="targetWeekdays"]');
      hidden.value = selected.join(",");
    });
  });

  // Clique global → fecha menus/painéis
  document.addEventListener("click", () => {
    closeAllMenus();
    closeAllDupPanels();
  });
});
