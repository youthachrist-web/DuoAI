// Parser mínimo para o CSV exportado do Worklab (colunas: nome, whatsapp,
// ultimo_exame, queixa). Sem dependências externas de propósito — é um
// formato simples e controlado pela própria LabDuo.

function parseWorklabCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).filter(Boolean).map((line) => {
    const cells = line.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] || "").replace(/^"|"$/g, "").trim();
    });
    return row;
  });
}

module.exports = { parseWorklabCSV };
