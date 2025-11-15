// utils/datas.js
//
// Funções utilitárias de datas para todo o sistema Kauê Study Tracker.
// Centraliza conversões, diferenças em dias e formatações.

function toISODate(value) {
  if (!value) return null;

  // Se for objeto Date
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  // Se já for string tipo "2025-01-21"
  if (typeof value === "string" && value.includes("-")) {
    return value.slice(0, 10);
  }

  return null;
}

// Diferença em dias entre uma data ISO (YYYY-MM-DD) e uma data de referência
// refDate default = hoje
function diffDias(isoStr, refDate = new Date()) {
  if (!isoStr || typeof isoStr !== "string" || !isoStr.includes("-")) {
    return Infinity;
  }

  const [ano, mes, dia] = isoStr.split("-");
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));

  const refMid = new Date(
    refDate.getFullYear(),
    refDate.getMonth(),
    refDate.getDate()
  );
  const dataMid = new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate()
  );

  const diffMs = refMid - dataMid;
  return diffMs / (1000 * 60 * 60 * 24);
}

// Atalho específico: diferença em dias entre HOJE e a data ISO
function diffDiasFromHoje(isoStr) {
  return diffDias(isoStr, new Date());
}

// Formata "2025-11-14" → "14/11"
function formatarLabelDia(isoStr) {
  if (!isoStr || !isoStr.includes("-")) return isoStr || "";
  const [ano, mes, dia] = isoStr.split("-");
  return `${dia}/${mes}`;
}

// Formata "2025-11-14" → "14/11/2025"
function formatarDDMMYYYY(isoStr) {
  if (!isoStr || !isoStr.includes("-")) return isoStr || "";
  const [ano, mes, dia] = isoStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

module.exports = {
  toISODate,
  diffDias,
  diffDiasFromHoje,
  formatarLabelDia,
  formatarDDMMYYYY
};
