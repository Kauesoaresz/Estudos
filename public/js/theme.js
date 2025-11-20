const html = document.documentElement;
const btn = document.getElementById("toggle-theme");

// carregar
const saved = localStorage.getItem("theme");

if (saved === "dark" || saved === "light") {
  html.classList.add(saved);
  btn.textContent = saved === "dark" ? "☀️" : "🌙";
} else {
  html.classList.add("dark");
  btn.textContent = "☀️";
}

// alternar
btn.addEventListener("click", () => {
  const dark = html.classList.contains("dark");

  if (dark) {
    html.classList.remove("dark");
    html.classList.add("light");
    btn.textContent = "🌙";
    localStorage.setItem("theme", "light");
  } else {
    html.classList.remove("light");
    html.classList.add("dark");
    btn.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  }
});
