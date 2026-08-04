// Parser do CSV exportado do Worklab. Sem dependências externas de propósito.
//
// Os cabeçalhos variam entre exportações (e entre quem mexe na planilha), então
// são reconhecidos de forma flexível em vez de exigir um layout exato. Colunas
// que não reconhecemos são preservadas em `extra` — jogar dados de paciente fora
// silenciosamente é pior do que carregar um campo a mais.

/** Aliases de cabeçalho → campo canónico.
 *
 * A ORDEM IMPORTA: vale a primeira regra que casa. As regras de agendamento e de
 * alerta ficam acima das regras largas (`data`, `resultado`), que senão engolem
 * "data da consulta" e "resultado alterado". Da mesma forma, uma coluna de link
 * só é usada para um fim específico quando o cabeçalho diz qual é: reaproveitar
 * um "link do resultado" como link de reagendamento manda o paciente para o
 * lugar errado.
 */
const HEADER_MAP = [
  [/^(nome|paciente|cliente|nome do paciente)$/, "nome"],
  [/(whats|telefone|celular|fone|contato|tel)/, "whatsapp"],
  [/(alerta|atencao|alterado|risco|urgente)/, "alerta"],
  // Os links vêm antes das datas: "link de reagendamento" contém "agendamento" e
  // era classificado como data da consulta. `\b` também protege esse caso —
  // "reagendamento" não tem fronteira de palavra antes de "agendamento".
  [/(link|url).*(resultado|laudo)|(resultado|laudo).*(link|url)/, "link_resultado"],
  [/(link|url).*(reagend|remarc)|(reagend|remarc).*(link|url)/, "link_reagendamento"],
  [/(link|url)/, "link"],
  [/(data da consulta|data do agendamento|data agendada|\bagendamento\b|\bconsulta\b)/, "data_consulta"],
  [/(hora|horario)/, "hora"],
  [/(unidade|filial|local de atendimento|local)/, "unidade"],
  [/(ultimo exame|data do exame|ultima coleta|data|exame anterior)/, "ultimo_exame"],
  [/(queixa|sintoma|observac|motivo|historico|obs)/, "queixa"],
];

function normalizeHeader(header) {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Marcadores de "sim" usados em planilhas brasileiras. */
function isTruthy(value) {
  return /^(1|s|sim|true|x|y|yes|alterado|alerta|atencao|atenção)$/i.test(String(value).trim());
}

/** Divide uma linha de CSV respeitando campos entre aspas com separador dentro. */
function splitCsvLine(line, sep) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // Aspas duplicadas dentro de um campo entre aspas são uma aspa literal.
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/^"|"$/g, ""));
}

/**
 * Lê o CSV do Worklab e devolve uma linha por paciente.
 *
 * Exportações brasileiras saem normalmente com ponto-e-vírgula (padrão do Excel
 * pt-BR), então o separador é detetado a partir do cabeçalho em vez de assumido.
 */
function parseWorklabCSV(text) {
  // Remove o BOM que o Excel escreve e que corromperia o primeiro cabeçalho.
  const clean = String(text || "").replace(/^﻿/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const semis = (lines[0].match(/;/g) || []).length;
  const commas = (lines[0].match(/,/g) || []).length;
  const sep = semis >= commas ? ";" : ",";

  const rawHeaders = splitCsvLine(lines[0], sep);
  const fields = rawHeaders.map((header) => {
    const normalized = normalizeHeader(header);
    for (const [pattern, field] of HEADER_MAP) {
      if (pattern.test(normalized)) return field;
    }
    return null;
  });

  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line, sep);
    const row = { nome: "", whatsapp: "", alerta: false, extra: {} };
    cells.forEach((value, i) => {
      if (!value) return;
      const field = fields[i];
      const header = rawHeaders[i] || `col${i}`;
      if (field === "alerta") row.alerta = isTruthy(value);
      else if (field === "queixa") row.queixa = row.queixa ? `${row.queixa}; ${value}` : value;
      else if (field) row[field] = value;
      else row.extra[header] = value;
    });
    // Linha sem nome e sem telefone é separador visual, não paciente.
    if (row.nome || row.whatsapp) rows.push(row);
  }
  return rows;
}

module.exports = { parseWorklabCSV, splitCsvLine, normalizeHeader };
