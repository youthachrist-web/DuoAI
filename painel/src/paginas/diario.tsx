import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { numero } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Pastilha, Selo, Vazio, campo } from "../componentes/base";
import { TIPOS_DE_PEDIDO } from "../lib/nichos";
import { janelaAberta, janelaDoSetor, textoDaJanela } from "../lib/melhores-horas";

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

  // Alguns arranques do Evolution devolvem um código de emparelhamento em texto,
  // que serve para quem não consegue apontar a câmara ao ecrã.
  const codigo = (qr.dados as { code?: string; pairingCode?: string } | null)?.pairingCode;

  return (
    <Cartao
      titulo="Ligar o WhatsApp da FourLife"
      accao={
        <div className="flex items-center gap-2">
          <Botao pequeno variante="contorno" onClick={qr.recarregar}>
            <I.Recarregar className={`h-3.5 w-3.5 ${qr.aCarregar ? "animate-spin" : ""}`} />
            Novo código
          </Botao>
          <Pastilha ok={false}>por ligar</Pastilha>
        </div>
      }
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
            {qr.erro ?? qr.dados?.detail ?? (qr.aCarregar ? "Código expirado, a pedir outro…" : "Sem código disponível neste momento.")}
          </p>
        )}
      </div>
      {codigo && (
        <p className="mt-3 text-center text-sm">
          Ou escreve o código: <strong className="font-mono tracking-widest">{codigo}</strong>
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-suave">
        Enquanto não estiver ligado, o botão de disparo abre a conversa no WhatsApp com a mensagem escrita,
        em vez de enviar. Nada sai sem a tua ordem, de qualquer forma.
      </p>
    </Cartao>
  );
}

function Interruptores({ aoMudar }: { aoMudar: () => void }) {
  const [autorizado, definirAutorizado] = useState<boolean | null>(null);
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
    <Cartao
      titulo={autorizado ? "Contactos autorizados" : "Contactos em espera — nada sai sem a tua ordem"}
      accao={<Pastilha ok={autorizado === true ? true : null}>{autorizado ? "a escrever" : "suspenso"}</Pastilha>}
    >
      <p className="text-sm leading-relaxed text-suave">
        {autorizado
          ? "O sistema já pode escrever aos leads. Podes suspender aqui a qualquer momento."
          : "Nenhuma mensagem automática é enviada, nem follow-ups já agendados."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Botao
          onClick={() =>
            correr("Contactos autorizados", async () => {
              await api.autorizarContactos();
              definirAutorizado(true);
            })
          }
          disabled={!!aCorrer}
        >
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
            correr("Relatórios limpos", api.limparRelatorios, "Isto apaga os relatórios já gerados. Continuar?")
          }
        >
          <I.Apagar className="h-4 w-4" />
          Limpar relatórios
        </Botao>
      </div>
      {nota && (
        <p className="mt-3">
          <Selo tom="bom">{nota}</Selo>
        </p>
      )}
      {erro && (
        <div className="mt-3">
          <Aviso tom="erro">Não consegui mudar o interruptor: {erro}</Aviso>
        </div>
      )}
    </Cartao>
  );
}

/* ------------------------------------------------------------- um disparo */

function Email({ item, aoFechar }: { item: api.ItemDaFila; aoFechar: () => void }) {
  const [para, definirPara] = useState("");
  const [assunto, definirAssunto] = useState("");
  const [corpo, definirCorpo] = useState("");
  const [ocupado, definirOcupado] = useState<"rascunho" | "envio" | null>(null);
  const [erro, definirErro] = useState<string | null>(null);
  const [enviado, definirEnviado] = useState(false);

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(para.trim());

  async function preparar() {
    definirErro(null);
    definirOcupado("rascunho");
    try {
      const r = await api.rascunhoDeEmail(item.id);
      definirAssunto(r.subject ?? r.assunto ?? "");
      definirCorpo(r.body ?? r.corpo ?? "");
    } catch (e) {
      definirErro(`Falha ao gerar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      definirOcupado(null);
    }
  }

  async function enviar() {
    if (!emailValido) {
      definirErro("Email inválido.");
      return;
    }
    definirErro(null);
    definirOcupado("envio");
    try {
      const r = await api.enviarEmail(item.id, { to: para.trim(), subject: assunto, body: corpo });
      // Só se diz "enviado" quando o servidor o afirma. Um HTTP 200 não é prova.
      if (r?.sent === false) definirErro(r.error ?? "Falha ao enviar.");
      else definirEnviado(true);
    } catch (e) {
      definirErro(`Falha ao enviar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      definirOcupado(null);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-borda bg-fundo p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="etiqueta">Revisar antes de enviar</p>
        <button type="button" onClick={aoFechar} className="etiqueta">
          fechar
        </button>
      </div>
      {enviado ? (
        <p className="py-3 text-center text-sm text-bom">E-mail enviado.</p>
      ) : (
        <>
          <input
            className={campo}
            placeholder="Email do destinatário"
            value={para}
            onChange={(e) => definirPara(e.target.value)}
          />
          <input
            className={`${campo} mt-2`}
            placeholder="Assunto"
            value={assunto}
            onChange={(e) => definirAssunto(e.target.value)}
          />
          <textarea
            className={`${campo} mt-2 min-h-32 resize-y`}
            placeholder="Mensagem"
            value={corpo}
            onChange={(e) => definirCorpo(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Botao pequeno variante="contorno" onClick={preparar} disabled={ocupado !== null}>
              {ocupado === "rascunho" ? "a escrever…" : "Preparar e-mail"}
            </Botao>
            <Botao
              pequeno
              onClick={enviar}
              disabled={ocupado !== null || !para.trim() || !assunto.trim() || !corpo.trim()}
            >
              {ocupado === "envio" ? "a enviar…" : "Enviar e-mail"}
            </Botao>
          </div>
          {para.trim() && !emailValido && <p className="mt-2 text-xs text-alerta">Email inválido.</p>}
          {erro && <p className="mt-2 text-xs text-alerta">{erro}</p>}
        </>
      )}
    </div>
  );
}

function Disparo({
  item,
  aoEnviar,
  aoSaltar,
}: {
  item: api.ItemDaFila;
  aoEnviar: () => void;
  aoSaltar: () => void;
}) {
  const [estado, definir] = useState<"parado" | "a enviar" | "enviado" | "aberto">("parado");
  const [erro, definirErro] = useState<string | null>(null);
  const [aberta, definirAberta] = useState(false);
  const [emailAberto, definirEmailAberto] = useState(false);
  const [pedido, definirPedido] = useState("");
  const [pedidoNota, definirPedidoNota] = useState<string | null>(null);

  const janela = janelaDoSetor(item.setor);
  const boaHora = janelaAberta(janela);

  async function disparar() {
    definirErro(null);
    definir("a enviar");
    // A janela abre-se ANTES de qualquer espera: se abrir depois, o browser trata-a
    // como popup e bloqueia-a, e o clique não leva a lado nenhum.
    const janelaNova = window.open(item.url, "_blank", "noopener");
    try {
      const r = await api.enviarWhatsApp(item.id);
      // Só se diz "enviada" quando o servidor diz que enviou. Um HTTP 200 não chega.
      if (r.sent) {
        janelaNova?.close();
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

  async function registar() {
    if (!pedido) return;
    try {
      await api.registarPedido(item.id, pedido);
      definirPedidoNota("Pedido registado.");
    } catch (e) {
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
          <p className="mt-1 font-mono text-xs tabular-nums text-suave">
            {item.numeroFormatado} · Celular · WhatsApp
          </p>
          {item.decisor && <p className="text-xs text-suave">a falar com {item.decisor}</p>}
          <p className={`mt-1 text-xs ${boaHora ? "font-medium text-marca" : "text-tenue"}`}>
            {textoDaJanela(janela)} · {boaHora ? "boa hora agora" : janela.razao}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Selo tom={item.pontuacao >= 90 ? "marca" : "neutro"}>{item.pontuacao}</Selo>
          <Botao onClick={disparar} disabled={estado === "a enviar" || estado === "enviado"} pequeno>
            <I.Conversa className="h-3.5 w-3.5" />
            {estado === "a enviar" ? "a abrir…" : estado === "enviado" ? "Contactado" : "DISPARAR"}
          </Botao>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <button type="button" onClick={() => definirAberta((a) => !a)} className="font-medium text-marca">
          {aberta ? "esconder a mensagem" : "ver a mensagem"}
        </button>
        <button
          type="button"
          onClick={() => definirEmailAberto((a) => !a)}
          className="font-medium text-marca"
        >
          {emailAberto ? "fechar o e-mail" : "preparar e-mail"}
        </button>
        <button type="button" onClick={aoSaltar} className="text-suave">
          saltar
        </button>
      </div>

      {aberta && (
        <p className="mt-2 whitespace-pre-wrap rounded-xl bg-fundo p-3 text-sm leading-relaxed">
          {item.mensagem}
        </p>
      )}

      {emailAberto && <Email item={item} aoFechar={() => definirEmailAberto(false)} />}

      {estado === "aberto" && (
        <p className="mt-2 text-xs leading-relaxed text-aviso">
          O envio por API não passou — a copy está escrita, é só carregar em enviar no WhatsApp.
          {erro && ` (${erro})`}
        </p>
      )}
      {estado === "enviado" && (
        <p className="mt-2 text-xs text-bom">
          Confirma o envio no WhatsApp. O lead já ficou marcado como contactado.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-borda pt-3">
        <select
          className={`${campo} max-w-[240px]`}
          value={pedido}
          onChange={(e) => definirPedido(e.target.value)}
        >
          <option value="">Registar pedido…</option>
          {TIPOS_DE_PEDIDO.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.nome}
            </option>
          ))}
        </select>
        <Botao pequeno variante="contorno" onClick={registar} disabled={!pedido}>
          Registar
        </Botao>
        {pedidoNota && <Selo tom="bom">{pedidoNota}</Selo>}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ página */

export function Diario() {
  const fila = usarDados(() => api.fila(25), { intervaloMs: 30_000 });
  const [saltados, definirSaltados] = useState<number[]>([]);
  const [mostrarContactados, definirMostrarContactados] = useState(false);

  const f = fila.dados;
  const itens = (f?.itens ?? []).filter((i) => !saltados.includes(i.id));

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Painel Diário"
        descricao="O teu plano para hoje. Empresas ordenadas pelo risco do setor e por conseguirmos falar com alguém."
      />

      <LigarWhatsApp />
      <Interruptores aoMudar={fila.recarregar} />

      <Cartao
        titulo="Fila de disparo"
        accao={<span className="etiqueta">{f ? `${f.estado.enviadosHoje} de ${f.estado.tecto} hoje` : "—"}</span>}
      >
        {fila.erro && <Aviso tom="erro">Não consegui ler a fila: {fila.erro}</Aviso>}
        {!f ? (
          <ACarregar>A montar a fila…</ACarregar>
        ) : (
          <>
            <p className="text-sm font-medium">{f.resumo}</p>
            <p className="mt-1 text-xs leading-relaxed text-suave">
              {numero(f.elegiveis)} elegíveis na base · {numero(f.postosDeParte)} de parte
              {f.motivosDeParte && ` — ${f.motivosDeParte}`}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-marca"
                  checked={mostrarContactados}
                  onChange={(e) => definirMostrarContactados(e.target.checked)}
                />
                Mostrar já contactados
              </label>
              {saltados.length > 0 && (
                <button type="button" onClick={() => definirSaltados([])} className="text-xs text-marca">
                  trazer de volta os {saltados.length} saltados
                </button>
              )}
            </div>

            {!itens.length ? (
              <Vazio>
                {saltados.length
                  ? "Saltaste todos os que havia. Traz de volta para os rever."
                  : "Sem ninguém elegível agora. Não há leads pendentes para contactar hoje com os filtros atuais."}
              </Vazio>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {itens.map((i) => (
                  <Disparo
                    key={i.id}
                    item={i}
                    aoEnviar={fila.recarregar}
                    aoSaltar={() => definirSaltados((s) => [...s, i.id])}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </Cartao>
    </div>
  );
}
