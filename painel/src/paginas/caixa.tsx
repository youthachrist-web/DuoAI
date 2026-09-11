import { useState } from "react";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { Aviso, Botao, Cabecalho, Cartao, campo } from "../componentes/base";

const VAZIO: api.EmailRecebido = { fromName: "", fromEmail: "", subject: "", body: "", instruction: "" };

export function CaixaDeEntrada() {
  const [recebido, definirRecebido] = useState<api.EmailRecebido>(VAZIO);
  const [resposta, definirResposta] = useState({ to: "", subject: "", body: "" });
  const [ocupado, definirOcupado] = useState<"rascunho" | "envio" | null>(null);
  const [erro, definirErro] = useState<string | null>(null);
  const [nota, definirNota] = useState<string | null>(null);
  const [copiado, definirCopiado] = useState(false);

  const mudar = (campo: keyof api.EmailRecebido) => (v: string) =>
    definirRecebido((r) => ({ ...r, [campo]: v }));

  async function rascunhar() {
    definirErro(null);
    definirNota(null);
    definirOcupado("rascunho");
    try {
      const r = await api.rascunharResposta(recebido);
      if (r.error) definirErro(r.error);
      else
        definirResposta({
          to: recebido.fromEmail,
          subject: r.subject ?? "",
          body: r.draft ?? "",
        });
    } catch (e) {
      definirErro(`Erro ao gerar rascunho: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      definirOcupado(null);
    }
  }

  async function enviar() {
    definirErro(null);
    definirNota(null);
    definirOcupado("envio");
    try {
      const r = await api.enviarResposta(resposta.to, resposta.subject, resposta.body);
      // Só se diz "enviado" quando o servidor não devolve erro. Um HTTP 200 com
      // {error} continua a ser uma falha, e já enganou uma vez.
      if (r?.error) definirErro(r.error);
      else {
        definirNota("Email enviado com sucesso.");
        definirResposta({ to: "", subject: "", body: "" });
        definirRecebido(VAZIO);
      }
    } catch (e) {
      definirErro(`Erro ao enviar email: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      definirOcupado(null);
    }
  }

  const podeRascunhar = recebido.body.trim().length > 10 && !!recebido.fromEmail.trim();
  const podeEnviar = !!resposta.to.trim() && !!resposta.subject.trim() && !!resposta.body.trim();

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Caixa"
        descricao="Cola o email que recebeste, diz em que direção queres responder, e o assistente escreve o rascunho."
      />

      {erro && <Aviso tom="erro">{erro}</Aviso>}
      {nota && <p className="text-sm text-bom">{nota}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Email recebido">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={campo}
              placeholder="Nome do remetente"
              value={recebido.fromName}
              onChange={(e) => mudar("fromName")(e.target.value)}
            />
            <input
              className={campo}
              placeholder="Email do remetente"
              value={recebido.fromEmail}
              onChange={(e) => mudar("fromEmail")(e.target.value)}
            />
          </div>
          <input
            className={`${campo} mt-2`}
            placeholder="Assunto do email recebido"
            value={recebido.subject}
            onChange={(e) => mudar("subject")(e.target.value)}
          />
          <textarea
            className={`${campo} mt-2 min-h-40 resize-y`}
            placeholder="Cola aqui o conteúdo do email que recebeste…"
            value={recebido.body}
            onChange={(e) => mudar("body")(e.target.value)}
          />
          <input
            className={`${campo} mt-2`}
            placeholder="Ex: responder com interesse mas pedir mais detalhes"
            value={recebido.instruction}
            onChange={(e) => mudar("instruction")(e.target.value)}
          />
          <div className="mt-3">
            <Botao onClick={rascunhar} disabled={!podeRascunhar || ocupado !== null}>
              <I.Robo className="h-4 w-4" />
              {ocupado === "rascunho" ? "a gerar rascunho…" : "Gerar rascunho"}
            </Botao>
          </div>
        </Cartao>

        <Cartao
          titulo="Resposta"
          accao={
            resposta.body ? (
              <Botao
                pequeno
                variante="contorno"
                onClick={async () => {
                  await navigator.clipboard.writeText(resposta.body);
                  definirCopiado(true);
                  setTimeout(() => definirCopiado(false), 1800);
                }}
              >
                {copiado ? "copiado" : "copiar"}
              </Botao>
            ) : undefined
          }
        >
          <input
            className={campo}
            placeholder="Para"
            value={resposta.to}
            onChange={(e) => definirResposta((r) => ({ ...r, to: e.target.value }))}
          />
          <input
            className={`${campo} mt-2`}
            placeholder="Assunto"
            value={resposta.subject}
            onChange={(e) => definirResposta((r) => ({ ...r, subject: e.target.value }))}
          />
          <textarea
            className={`${campo} mt-2 min-h-52 resize-y`}
            placeholder="O rascunho aparece aqui, e podes mudá-lo antes de enviar."
            value={resposta.body}
            onChange={(e) => definirResposta((r) => ({ ...r, body: e.target.value }))}
          />
          <div className="mt-3">
            <Botao onClick={enviar} disabled={!podeEnviar || ocupado !== null}>
              <I.Caixa className="h-4 w-4" />
              {ocupado === "envio" ? "a enviar…" : "Enviar via Resend"}
            </Botao>
          </div>
        </Cartao>
      </div>
    </div>
  );
}
