import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import { numero } from "../lib/formatar";
import { Aviso, Botao, Cartao, Pastilha, Vazio } from "../componentes/base";

/** O QR do Evolution renova-se sozinho; pedi-lo mais depressa do que isto derruba a sessão. */
const INTERVALO_QR_MS = 15_000;

function LigarWhatsApp() {
  const estado = usarDados(api.estadoWhatsApp, { intervaloMs: 10_000 });
  const ligado = estado.dados?.state === "open";
  const qr = usarDados(api.codigoQr, { intervaloMs: ligado ? undefined : INTERVALO_QR_MS });

  if (ligado) {
    return (
      <Cartao titulo="WhatsApp da FourLife" accao={<Pastilha ok>ligado</Pastilha>}>
        <p className="text-sm text-suave">
          O telemóvel está ligado. Os disparos saem por aqui.
        </p>
      </Cartao>
    );
  }

  return (
    <Cartao titulo="Ligar o WhatsApp da FourLife" accao={<Pastilha ok={false}>por ligar</Pastilha>}>
      <p className="text-sm leading-relaxed">
        No telemóvel: <strong>WhatsApp → Aparelhos conectados → Conectar um aparelho</strong>, e aponta
        a câmara ao código.
      </p>
      <div className="mt-4 grid place-items-center rounded-lg border border-borda bg-white p-4">
        {qr.dados?.image ? (
          <img src={qr.dados.image} alt="Código QR para ligar o WhatsApp" className="h-56 w-56" />
        ) : (
          <p className="py-16 text-sm text-suave">
            {qr.erro ?? qr.dados?.detail ?? "a pedir um código…"}
          </p>
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-suave">
        Enquanto não estiver ligado, o botão de disparo abre a conversa no WhatsApp com a mensagem
        escrita, em vez de enviar. Nada sai sem a tua ordem, de qualquer forma.
      </p>
    </Cartao>
  );
}

function Disparo({ item, aoEnviar }: { item: api.ItemDaFila; aoEnviar: () => void }) {
  const [estado, definir] = useState<"parado" | "a enviar" | "enviado" | "aberto">("parado");
  const [erro, definirErro] = useState<string | null>(null);

  async function disparar() {
    definirErro(null);
    definir("a enviar");
    // A janela abre-se ANTES de qualquer espera: se abrir depois, o browser trata-a
    // como popup e bloqueia-a, e o clique não leva a lado nenhum.
    const janela = window.open(item.url, "_blank", "noopener");
    try {
      const r = await api.enviarWhatsApp(item.id);
      // Só se diz "enviada" quando o servidor diz que enviou. Um 200 não chega.
      if (r.sent) {
        janela?.close();
        definir("enviado");
      } else {
        definir("aberto");
      }
      aoEnviar();
    } catch (e) {
      definir("aberto");
      definirErro(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <li className="rounded-lg border border-borda p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-snug break-words">{item.empresa}</p>
          <p className="text-xs text-suave">
            {item.cidade} · {item.setor}
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-suave">{item.numeroFormatado}</p>
          {item.decisor && <p className="text-xs text-suave">a falar com {item.decisor}</p>}
        </div>
        <Botao onClick={disparar} disabled={estado === "a enviar" || estado === "enviado"}>
          {estado === "a enviar" ? "a abrir…" : estado === "enviado" ? "enviada" : "Disparar"}
        </Botao>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-suave">ver a mensagem</summary>
        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-fundo p-3 text-sm leading-relaxed">
          {item.mensagem}
        </p>
      </details>
      {estado === "aberto" && (
        <p className="mt-2 text-xs text-aviso">
          Abri a conversa no WhatsApp com o texto pronto — falta carregares em enviar. {erro}
        </p>
      )}
    </li>
  );
}

export function Diario() {
  const fila = usarDados(() => api.fila(25), { intervaloMs: 30_000 });
  const f = fila.dados;

  return (
    <div className="space-y-5">
      <LigarWhatsApp />

      <Cartao
        titulo="Fila de disparo"
        accao={
          <span className="text-xs tabular-nums text-suave">
            {f ? `${f.estado.enviadosHoje} de ${f.estado.tecto} hoje` : "—"}
          </span>
        }
      >
        {fila.erro && <Aviso>{fila.erro}</Aviso>}
        {!f ? (
          <Vazio>a ler a fila…</Vazio>
        ) : (
          <>
            <p className="text-sm">{f.resumo}</p>
            <p className="mt-1 text-xs text-suave">
              {numero(f.elegiveis)} elegíveis na base · {numero(f.postosDeParte)} de parte
              {f.motivosDeParte && ` — ${f.motivosDeParte}`}
            </p>
            {f.itens.length === 0 ? (
              <Vazio>Não há ninguém à espera. O tecto de hoje já foi cumprido.</Vazio>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {f.itens.map((i) => (
                  <Disparo key={i.id} item={i} aoEnviar={fila.recarregar} />
                ))}
              </ul>
            )}
          </>
        )}
      </Cartao>
    </div>
  );
}
