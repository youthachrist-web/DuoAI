import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { numero } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cartao, Pastilha, Selo, Vazio } from "../componentes/base";

/** O QR do Evolution renova-se sozinho; pedi-lo mais depressa do que isto derruba a sessão. */
const INTERVALO_QR_MS = 15_000;

function LigarWhatsApp() {
  const estado = usarDados(api.estadoWhatsApp, { intervaloMs: 10_000 });
  const ligado = estado.dados?.state === "open";
  const qr = usarDados(api.codigoQr, { intervaloMs: ligado ? undefined : INTERVALO_QR_MS });

  if (ligado) {
    return (
      <Cartao titulo="WhatsApp da FourLife" accao={<Pastilha ok>ligado</Pastilha>}>
        <p className="text-sm leading-relaxed text-suave">
          O telemóvel está ligado. Os disparos saem por aqui, e cada um continua a precisar da tua ordem.
        </p>
      </Cartao>
    );
  }

  return (
    <Cartao
      titulo="Ligar o WhatsApp da FourLife"
      accao={<Pastilha ok={false}>por ligar</Pastilha>}
      className="border-aviso/40"
    >
      <p className="text-sm leading-relaxed">
        No telemóvel: <strong>WhatsApp → Aparelhos conectados → Conectar um aparelho</strong>, e aponta a
        câmara ao código.
      </p>
      <div className="mt-4 grid place-items-center rounded-xl border border-borda bg-white p-4">
        {qr.dados?.image ? (
          <img
            src={qr.dados.image}
            alt="Código QR para ligar o WhatsApp da FourLife"
            className="h-56 w-56 max-w-full"
          />
        ) : (
          <p className="py-16 text-center font-mono text-sm text-tenue">
            {qr.erro ?? qr.dados?.detail ?? "a pedir um código…"}
          </p>
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-suave">
        Enquanto não estiver ligado, o botão de disparo abre a conversa no WhatsApp com a mensagem escrita,
        em vez de enviar. Nada sai sem a tua ordem, de qualquer forma.
      </p>
    </Cartao>
  );
}

function Interruptores({ aoMudar }: { aoMudar: () => void }) {
  const [aCorrer, definirACorrer] = useState<string | null>(null);
  const [nota, definirNota] = useState<string | null>(null);
  const [erro, definirErro] = useState<string | null>(null);

  async function correr(nome: string, accao: () => Promise<unknown>, confirmacao?: string) {
    // As duas que apagam histórico pedem confirmação: são fáceis de carregar por
    // engano no telemóvel e não há como desfazer.
    if (confirmacao && !window.confirm(confirmacao)) return;
    definirErro(null);
    definirNota(null);
    definirACorrer(nome);
    try {
      await accao();
      definirNota(nome);
      aoMudar();
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirACorrer(null);
    }
  }

  return (
    <Cartao titulo="Contactos em espera — nada sai sem a tua ordem">
      <p className="text-sm leading-relaxed text-suave">
        Nenhuma mensagem automática é enviada, nem follow-ups já agendados.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Botao onClick={() => correr("Contactos autorizados", api.autorizarContactos)} disabled={!!aCorrer}>
          <I.Tocar className="h-4 w-4" />
          {aCorrer === "Contactos autorizados" ? "a autorizar…" : "Iniciar contactos"}
        </Botao>
        <Botao
          variante="contorno"
          disabled={!!aCorrer}
          onClick={() =>
            correr(
              "Histórico de contactos a zero",
              api.zerarContactados,
              "Isto apaga a marca de «já contactado» em todos os leads. Eles voltam à fila e podem receber a mesma mensagem outra vez. Continuar?",
            )
          }
        >
          <I.Apagar className="h-4 w-4" />
          Zerar contactados
        </Botao>
        <Botao
          variante="contorno"
          disabled={!!aCorrer}
          onClick={() =>
            correr(
              "Relatórios apagados",
              api.limparRelatorios,
              "Isto apaga os relatórios já gerados. Continuar?",
            )
          }
        >
          <I.Apagar className="h-4 w-4" />
          Limpar relatórios
        </Botao>
      </div>
      {nota && (
        <p className="mt-3 text-sm text-bom">
          <Selo tom="bom">{nota}</Selo>
        </p>
      )}
      {erro && (
        <div className="mt-3">
          <Aviso tom="erro">{erro}</Aviso>
        </div>
      )}
    </Cartao>
  );
}

function Disparo({ item, aoEnviar }: { item: api.ItemDaFila; aoEnviar: () => void }) {
  const [estado, definir] = useState<"parado" | "a enviar" | "enviado" | "aberto">("parado");
  const [erro, definirErro] = useState<string | null>(null);
  const [aberta, definirAberta] = useState(false);

  async function disparar() {
    definirErro(null);
    definir("a enviar");
    // A janela abre-se ANTES de qualquer espera: se abrir depois, o browser trata-a
    // como popup e bloqueia-a, e o clique não leva a lado nenhum.
    const janela = window.open(item.url, "_blank", "noopener");
    try {
      const r = await api.enviarWhatsApp(item.id);
      // Só se diz "enviada" quando o servidor diz que enviou. Um HTTP 200 não chega.
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
    <li className="rounded-xl border border-borda p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{item.empresa}</p>
          <p className="mt-0.5 text-xs text-suave">
            {item.cidade} · {item.setor}
          </p>
          <p className="mt-1 font-mono text-xs tabular-nums text-suave">{item.numeroFormatado}</p>
          {item.decisor && <p className="text-xs text-suave">a falar com {item.decisor}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Selo tom={item.pontuacao >= 90 ? "marca" : "neutro"}>{item.pontuacao}</Selo>
          <Botao onClick={disparar} disabled={estado === "a enviar" || estado === "enviado"} pequeno>
            <I.Conversa className="h-3.5 w-3.5" />
            {estado === "a enviar" ? "a abrir…" : estado === "enviado" ? "enviada" : "DISPARAR"}
          </Botao>
        </div>
      </div>

      <button
        type="button"
        onClick={() => definirAberta((a) => !a)}
        className="mt-2.5 text-xs font-medium text-marca"
      >
        {aberta ? "esconder a mensagem" : "ver a mensagem"}
      </button>
      {aberta && (
        <p className="mt-2 whitespace-pre-wrap rounded-xl bg-fundo p-3 text-sm leading-relaxed">
          {item.mensagem}
        </p>
      )}

      {estado === "aberto" && (
        <p className="mt-2 text-xs leading-relaxed text-aviso">
          Abri a conversa no WhatsApp com o texto pronto — falta carregares em enviar.
          {erro && ` (${erro})`}
        </p>
      )}
      {estado === "enviado" && (
        <p className="mt-2 text-xs text-bom">Enviada. O lead ficou marcado como contactado.</p>
      )}
    </li>
  );
}

export function Diario() {
  const fila = usarDados(() => api.fila(25), { intervaloMs: 30_000 });
  const f = fila.dados;

  return (
    <div className="space-y-4">
      <LigarWhatsApp />
      <Interruptores aoMudar={fila.recarregar} />

      <Cartao
        titulo="Fila de disparo"
        accao={
          <span className="etiqueta">
            {f ? `${f.estado.enviadosHoje} de ${f.estado.tecto} hoje` : "—"}
          </span>
        }
      >
        {fila.erro && <Aviso tom="erro">{fila.erro}</Aviso>}
        {!f ? (
          <ACarregar>A montar a fila…</ACarregar>
        ) : (
          <>
            <p className="text-sm font-medium">{f.resumo}</p>
            <p className="mt-1 text-xs leading-relaxed text-suave">
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
