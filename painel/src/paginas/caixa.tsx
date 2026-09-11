import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { quandoFoi } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Selo, Vazio, campo } from "../componentes/base";

export function CaixaDeEntrada() {
  const historico = usarDados(() => api.comunicacoes(50), { intervaloMs: 60_000 });
  const leads = usarDados(() => api.leads(500));

  const [leadId, definirLeadId] = useState("");
  const [assunto, definirAssunto] = useState("");
  const [corpo, definirCorpo] = useState("");
  const [ocupado, definirOcupado] = useState<"rascunho" | "envio" | null>(null);
  const [erro, definirErro] = useState<string | null>(null);
  const [nota, definirNota] = useState<string | null>(null);

  const comEmail = (leads.dados ?? []).filter((l) => l.email);

  async function rascunhar() {
    if (!leadId) {
      definirErro("Escolhe primeiro a empresa.");
      return;
    }
    definirErro(null);
    definirNota(null);
    definirOcupado("rascunho");
    try {
      const r = await api.rascunhoDeEmail(Number(leadId));
      definirAssunto(r.subject ?? r.assunto ?? "");
      definirCorpo(r.body ?? r.corpo ?? "");
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirOcupado(null);
    }
  }

  async function enviar() {
    if (!leadId) return;
    definirErro(null);
    definirNota(null);
    definirOcupado("envio");
    try {
      const r = await api.enviarEmail(Number(leadId), { subject: assunto, body: corpo });
      // Só se diz "enviado" quando o servidor o afirma. Um HTTP 200 não é prova.
      if (r?.sent === false) definirErro(r.error ?? "O servidor não confirmou o envio.");
      else {
        definirNota("Email enviado.");
        await historico.recarregar();
      }
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirOcupado(null);
    }
  }

  return (
    <div className="space-y-4">
      <Cabecalho titulo="Caixa" descricao="Escrever a um lead por email, com o rascunho preparado pelo assistente." />

      {erro && <Aviso tom="erro">{erro}</Aviso>}
      {nota && <p className="text-sm text-bom">{nota}</p>}

      <Cartao titulo="Escrever">
        <select className={campo} value={leadId} onChange={(e) => definirLeadId(e.target.value)}>
          <option value="">Escolher empresa…</option>
          {comEmail.map((l) => (
            <option key={l.id} value={l.id}>
              {l.businessName} · {l.email}
            </option>
          ))}
        </select>

        <div className="mt-2 flex flex-wrap gap-2">
          <Botao variante="contorno" onClick={rascunhar} disabled={!leadId || ocupado !== null}>
            <I.Robo className="h-4 w-4" />
            {ocupado === "rascunho" ? "a escrever…" : "Preparar rascunho"}
          </Botao>
        </div>

        <input
          className={`${campo} mt-3`}
          placeholder="Assunto"
          value={assunto}
          onChange={(e) => definirAssunto(e.target.value)}
        />
        <textarea
          className={`${campo} mt-2 min-h-44 resize-y`}
          placeholder="Corpo do email"
          value={corpo}
          onChange={(e) => definirCorpo(e.target.value)}
        />

        <div className="mt-3">
          <Botao onClick={enviar} disabled={!leadId || !assunto.trim() || !corpo.trim() || ocupado !== null}>
            <I.Caixa className="h-4 w-4" />
            {ocupado === "envio" ? "a enviar…" : "Enviar email"}
          </Botao>
        </div>
      </Cartao>

      <Cartao titulo="O que já saiu">
        {!historico.dados ? (
          <ACarregar />
        ) : !historico.dados.length ? (
          <Vazio>Ainda não saiu nenhuma mensagem.</Vazio>
        ) : (
          <ul className="space-y-3">
            {historico.dados.map((c) => (
              <li key={c.id} className="border-b border-borda/60 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-snug">{c.subject ?? c.type ?? c.channel}</p>
                  <Selo tom={c.status === "sent" || c.status === "delivered" ? "bom" : "neutro"}>
                    {c.status}
                  </Selo>
                </div>
                <p className="mt-0.5 break-all text-xs text-suave">{c.toAddress}</p>
                {c.createdAt && <p className="text-xs text-tenue">{quandoFoi(c.createdAt)}</p>}
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
