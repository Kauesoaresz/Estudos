// =======================================================
// KAUÊ STUDY TRACKER - MODO FOCO PREMIUM
// =======================================================

document.addEventListener("DOMContentLoaded", () => {

  const body = document.body;
  const toggleBtn = document.getElementById("kstFocusToggle");
  const exitBtn = document.getElementById("kstExitFocus");

  const STORAGE_KEY = "kst-focus-mode";

  // -------------------------------------------------------
  // Restaurar estado salvo
  // -------------------------------------------------------
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "on") {
    body.classList.add("kst-focus-mode");
  }

  // -------------------------------------------------------
  // Função principal
  // -------------------------------------------------------
  function toggleFocus() {
    const isActive = body.classList.toggle("kst-focus-mode");

    if (isActive) {
      localStorage.setItem(STORAGE_KEY, "on");
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // -------------------------------------------------------
  // Eventos dos botões
  // -------------------------------------------------------
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleFocus);
  }

  if (exitBtn) {
    exitBtn.addEventListener("click", toggleFocus);
  }

});
