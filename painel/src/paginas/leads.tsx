import { useMemo, useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { numero, data } from "../lib/formatar";
import { ACarregar, Botao, Cabecalho, Cartao, Selo, Tabela, Vazio, campo } from "../componentes/base";

const CAMPOS_CSV = [
  "id",
  "businessName",
  "city",
  "niche",
  "tier",
  "score",
  "phone",
  "whatsapp",
  "email",
  "website",
  "address",
  "stage",
  "lastContactedAt",
] as const;

/** Uma célula de CSV que aguenta vírgulas, aspas e quebras de linha lá dentro. */
function celula(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function baixarCsv(lista: api.Lead[]) {
  const linhas = [
    CAMPOS_CSV.join(";"),
    ...lista.map((l) => CAMPOS_CSV.map((c) => celula((l as Record<string, unknown>)[c])).join(";")),
  ];
  // O BOM é o que faz o Excel em português abrir os acentos como deve ser.
  const blob = new Blob(["﻿" + linhas.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fourlife-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Sinais({ lead }: { lead: api.Lead }) {
  const sinais: string[] = [];
  if (lead.whatsapp) sinais.push("WhatsApp");
  else if (lead.phone) sinais.push("telefone");
  if (lead.email) sinais.push("email");
  if (lead.website) sinais.push("site");
  if (lead.linkedinUrl) sinais.push("LinkedIn");
  if (!sinais.length) return <span className="text-tenue">sem contacto</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {sinais.map((s) => (
        <Selo key={s}>{s}</Selo>
      ))}
    </span>
  );
}

export function Leads() {
  const lista = usarDados(() => api.leads(2000), { intervaloMs: 120_000 });
  const facetas = usarDados(api.facetas, { intervaloMs: 120_000 });
  const exportacao = usarDados(api.ultimaExportacao);

  const [procura, definirProcura] = useState("");
  const [cidade, definirCidade] = useState("");
  const [setor, definirSetor] = useState("");
  const [tier, definirTier] = useState("");
  const [soComContacto, definirSoComContacto] = useState(false);
  const [soPorContactar, definirSoPorContactar] = useState(false);
  const [quantos, definirQuantos] = useState(100);

  const filtrados = useMemo(() => {
    const p = procura.trim().toLowerCase();
    return (lista.dados ?? []).filter((l) => {
      if (cidade && l.city !== cidade) return false;
      if (setor && l.niche !== setor) return false;
      if (tier && l.tier !== tier) return false;
      if (soComContacto && !l.whatsapp && !l.phone) return false;
      if (soPorContactar && l.lastContactedAt) return false;
      if (!p) return true;
      return (
        l.businessName.toLowerCase().includes(p) ||
        (l.email ?? "").toLowerCase().includes(p) ||
        (l.city ?? "").toLowerCase().includes(p) ||
        (l.phone ?? "").includes(p) ||
        (l.whatsapp ?? "").includes(p)
      );
    });
  }, [lista.dados, procura, cidade, setor, tier, soComContacto, soPorContactar]);

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Pipeline B2B · SST"
        descricao="Empresas de risco operacional mapeadas em Santa Catarina, Rio Grande do Sul e São Paulo. Abre a mensagem para ver a copy já modelada para o setor e disparar."
      />

      <Cartao>
        <div className="flex flex-wrap items-center gap-2">
          <Botao
            variante="contorno"
            onClick={() => baixarCsv(filtrados)}
            disabled={!filtrados.length}
          >
            <I.Descarregar className="h-4 w-4" />
            Baixar lista {filtrados.length ? `(${numero(filtrados.length)})` : ""}
          </Botao>
          <span className="text-xs text-suave">
            {exportacao.dados?.at
              ? `Último download: ${data(exportacao.dados.at)}`
              : "Ainda não houve nenhum download."}
          </span>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <I.Lupa className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue" />
            <input
              className={`${campo} pl-9`}
              placeholder="Procurar empresa, email, número"
              value={procura}
              onChange={(e) => definirProcura(e.target.value)}
            />
          </div>
          <select className={campo} value={tier} onChange={(e) => definirTier(e.target.value)}>
            <option value="">Todos os tiers</option>
            {facetas.dados?.tiers.map((t) => (
              <option key={t.value} value={t.value}>
                Tier {t.value} ({numero(t.count)})
              </option>
            ))}
          </select>
          <select className={campo} value={cidade} onChange={(e) => definirCidade(e.target.value)}>
            <option value="">Todas as cidades</option>
            {facetas.dados?.cities.map((c) => (
              <option key={c.value} value={c.value}>
                {c.value} ({numero(c.count)})
              </option>
            ))}
          </select>
          <select className={campo} value={setor} onChange={(e) => definirSetor(e.target.value)}>
            <option value="">Todos os setores</option>
            {facetas.dados?.sectors.map((s) => (
              <option key={s.value} value={s.value}>
                {s.value} ({numero(s.count)})
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={soComContacto}
              onChange={(e) => definirSoComContacto(e.target.checked)}
              className="h-4 w-4 accent-marca"
            />
            Com telefone ou WhatsApp
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={soPorContactar}
              onChange={(e) => definirSoPorContactar(e.target.checked)}
              className="h-4 w-4 accent-marca"
            />
            Ainda não contactados
          </label>
        </div>
      </Cartao>

      <Cartao
        titulo={`${numero(filtrados.length)} de ${numero(lista.dados?.length ?? 0)} leads`}
        semPadding
      >
        {lista.aCarregar && !lista.dados ? (
          <ACarregar>A carregar a lista…</ACarregar>
        ) : !filtrados.length ? (
          <Vazio>Nenhum lead corresponde a estes filtros.</Vazio>
        ) : (
          <>
            <Tabela colunas={["Empresa", "Onde", "Pontos", "Sinais", "Falámos"]}>
              {filtrados.slice(0, quantos).map((l) => (
                <tr key={l.id} className="border-b border-borda/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium leading-snug">{l.businessName}</p>
                    <p className="font-mono text-xs text-suave">{l.whatsapp ?? l.phone ?? l.email ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-suave">
                    <p>{l.city}</p>
                    <p className="text-xs text-tenue">{l.niche}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Selo tom={l.tier === "A" ? "marca" : "neutro"}>
                      {l.score} · {l.tier}
                    </Selo>
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    <Sinais lead={l} />
                  </td>
                  <td className="px-4 py-3 text-right align-top text-suave">
                    {l.lastContactedAt ? data(l.lastContactedAt) : <span className="text-tenue">nunca</span>}
                  </td>
                </tr>
              ))}
            </Tabela>
            {filtrados.length > quantos && (
              <div className="border-t border-borda p-4 text-center">
                <Botao variante="contorno" onClick={() => definirQuantos((q) => q + 200)}>
                  Mostrar mais {numero(Math.min(200, filtrados.length - quantos))}
                </Botao>
              </div>
            )}
          </>
        )}
      </Cartao>
    </div>
  );
}
