import { useCallback, useEffect, useMemo, useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { numero } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cartao, Pastilha, Selo, campo } from "../componentes/base";
import { TIPOS_DE_PEDIDO } from "../lib/nichos";
import { sinaisDoLead } from "../lib/telefone";

/** O QR do Evolution renova-se sozinho; pedi-lo mais depressa do que isto derruba a sessão. */
const INTERVALO_QR_MS = 15_000;

/* ------------------------------------------------------- ligar o WhatsApp */

function LigarWhatsApp() {
  const qr = usarDados(api.codigoQr, { intervaloMs: INTERVALO_QR_MS });
  const [segundos, definirSegundos] = useState<number | null>(null);

  // O servidor diz quanto tempo falta; a contagem é feita aqui para o número
  // andar sem pedir nada ao servidor a cada segundo.
  useEffect(() => {
    definirSegundos(qr.dados?.expiraEmMs ? Math.ceil(qr.dados.expiraEmMs / 1000) : null);
  }, [qr.dados]);

  useEffect(() => {
    if (segundos === null || segundos <= 0) return;
    const t = setInterval(() => definirSegundos((s) => (s === null ? null : Math.max(0, s - 1))), 1000);
    return () => clearInterval(t);
  }, [segundos]);

  const estado = usarDados(api.estadoWhatsApp, { intervaloMs: 20_000 });
  if (estado.dados?.state === "open") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-marca/30 bg-marca-tenue px-3 py-2.5 text-xs">
        <I.Conversa className="h-4 w-4 shrink-0 text-marca" />
        <span>
          WhatsApp ligado{estado.dados.instancia ? ` (${estado.dados.instancia})` : ""} — o disparo envia por API.
        </span>
      </div>
    );
  }

  const codigo = (qr.dados as { pairingCode?: string } | null)?.pairingCode;

  return (
    <Cartao className="border-aviso/40">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-aviso/30 bg-aviso-tenue">
          <I.Conversa className="h-4 w-4 text-aviso" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Ligar o WhatsApp da FourLife</p>
          <p className="mt-0.5 text-xs leading-relaxed text-suave">
            No telemóvel: WhatsApp → <b>Aparelhos conectados</b> → <b>Conectar um aparelho</b> → aponta a
            câmara ao código. Ele renova-se sozinho.
          </p>
        </div>
        <button
          type="button"
          onClick={qr.recarregar}
          aria-label="Novo código"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-borda hover:bg-fundo"
        >
          <I.Recarregar className={`h-3.5 w-3.5 ${qr.aCarregar ? "animate-spin" : ""}`} />
        </button>
      </div>

      {qr.dados?.image ? (
        <div className="mt-3 flex flex-col items-center gap-2">
          <img
            src={qr.dados.image}
            alt="Código QR para ligar o WhatsApp da FourLife"
            className="h-56 w-56 max-w-full rounded-xl border border-borda bg-white p-2"
          />
          {codigo && (
            <p className="text-xs text-suave">
              Ou escreve o código: <b className="font-mono tracking-widest">{codigo}</b>
            </p>
          )}
          {segundos !== null && (
            <p className={`font-mono text-xs ${segundos <= 3 ? "text-aviso" : "text-suave"}`}>
              {segundos > 0 ? `Código válido por ${segundos}s — lê agora` : "Código expirado, a pedir outro…"}
            </p>
          )}
        </div>
      ) : (
        <p className="py-6 text-center text-xs text-suave">
          {qr.aCarregar
            ? "A pedir um código novo…"
            : (qr.erro ?? qr.dados?.detail ?? "Sem código disponível neste momento.")}
        </p>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-suave">
        Enquanto não estiver ligado, o botão de disparo abre o WhatsApp com a mensagem pronta em vez de
        enviar. Nada é enviado sem a tua ordem, de qualquer forma.
      </p>
    </Cartao>
  );
}

/* ------------------------------------------------------------ interruptores */

function Interruptores({ aoMudar }: { aoMudar: () => void }) {
  const estado = usarDados(api.estadoDoOutreach);
  const [ocupado, definirOcupado] = useState<string | null>(null);
  const [nota, definirNota] = useState<string | null>(null);
  const [erro, definirErro] = useState<string | null>(null);

  const ligado = estado.dados?.enabled ?? false;

  async function alternar() {
    definirErro(null);
    definirNota(null);
    definirOcupado("toggle");
    try {
      const novo = await api.mudarOutreach(!ligado);
      definirNota(
        novo.enabled
          ? "Contactos autorizados — o sistema já pode escrever aos leads."
          : "Contactos suspensos — nenhuma mensagem automática sai até autorizares outra vez.",
      );
      await estado.recarregar();
      aoMudar();
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirOcupado(null);
    }
  }

  async function limpar(qual: "contacts" | "reports") {
    const pergunta =
      qual === "contacts"
        ? "Isto apaga a marca de «já contactado» em todos os leads. Eles voltam à fila e podem receber a mesma mensagem outra vez. Continuar?"
        : "Isto apaga os relatórios já gerados. Continuar?";
    if (!window.confirm(pergunta)) return;
    definirErro(null);
    definirNota(null);
    definirOcupado(qual);
    try {
      if (qual === "contacts") {
        const r = await api.zerarContactados();
        definirNota(
          `Histórico de contactos a zero: ${numero(r.leadsLimpos)} leads desmarcados, ${numero(r.comunicacoesRemovidas)} comunicações e ${numero(r.followupsRemovidos)} follow-ups removidos. Opt-outs mantidos.`,
        );
      } else {
        const r = await api.limparRelatorios();
        definirNota(`Relatórios limpos: ${numero(r.relatoriosRemovidos)} removidos.`);
      }
      aoMudar();
    } catch (e) {
      definirErro(e instanceof Error ? e.message : String(e));
    } finally {
      definirOcupado(null);
    }
  }

  return (
    <Cartao className={ligado ? "border-marca/50" : ""}>
      <LigarWhatsApp />

      <div className="mt-3 flex items-start gap-3">
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${
            ligado ? "border-marca/30 bg-marca-tenue" : "border-borda bg-fundo"
          }`}
        >
          <I.Escudo className={`h-4 w-4 ${ligado ? "text-marca" : "text-suave"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            {estado.dados === null
              ? "A ler o estado…"
              : ligado
                ? "Contactos autorizados"
                : "Contactos em espera — nada sai sem a tua ordem"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-suave">
            {ligado
              ? "O sistema escreve aos leads e envia follow-ups. Suspende aqui quando quiseres."
              : "Nenhuma mensagem automática é enviada, nem follow-ups já agendados."}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Botao
          pequeno
          variante={ligado ? "contorno" : "principal"}
          onClick={alternar}
          disabled={estado.dados === null || ocupado !== null}
        >
          <I.Tocar className="h-4 w-4" />
          {ligado ? "Suspender contactos" : "Iniciar contactos"}
        </Botao>
        <Botao pequeno variante="contorno" onClick={() => limpar("contacts")} disabled={ocupado !== null}>
          <I.Apagar className="h-4 w-4" />
          Zerar contactados
        </Botao>
        <Botao pequeno variante="contorno" onClick={() => limpar("reports")} disabled={ocupado !== null}>
          <I.Apagar className="h-4 w-4" />
          Limpar relatórios
        </Botao>
      </div>

      {nota && <p className="mt-3 text-xs leading-relaxed text-bom">{nota}</p>}
      {erro && (
        <div className="mt-3">
          <Aviso tom="erro">Não consegui mudar o interruptor: {erro}</Aviso>
        </div>
      )}
    </Cartao>
  );
}

/* ------------------------------------------------------- a fila de disparo */

function FilaDeDisparo() {
  const fila = usarDados(() => api.fila(30), { intervaloMs: 30_000 });
  const [saltados, definirSaltados] = useState<number[]>([]);
  const [mensagem, definirMensagem] = useState("");
  const [aDisparar, definirADisparar] = useState(false);
  const [aviso, definirAviso] = useState<string | null>(null);
  const [erro, definirErro] = useState<string | null>(null);
  const [espera, definirEspera] = useState(0);

  const f = fila.dados;
  const actual = useMemo(
    () => f?.itens.find((i) => !saltados.includes(i.id)) ?? null,
    [f, saltados],
  );

  // A mensagem entra como o servidor a escreveu e fica editável a partir daí.
  useEffect(() => definirMensagem(actual?.mensagem ?? ""), [actual?.id, actual?.mensagem]);

  // O intervalo entre disparos é de propósito e nunca é igual duas vezes.
  useEffect(() => {
    const ms = f?.estado.esperarMs ?? 0;
    definirEspera(Math.ceil(ms / 1000));
    if (ms <= 0) return;
    const t = setInterval(() => definirEspera((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [f?.estado.esperarMs]);

  const disparar = useCallback(async () => {
    if (!actual || aDisparar) return;
    definirErro(null);
    definirAviso(null);
    definirADisparar(true);
    // A janela abre ANTES da espera: se abrisse depois, o browser bloqueava-a.
    const janela = window.open("about:blank", "_blank");
    try {
      const r = await api.enviarWhatsApp(actual.id, mensagem);
      if (r.sent) {
        janela?.close();
        definirAviso(`${actual.empresa} recebeu a mensagem por API.`);
      } else if (r.url) {
        if (janela) janela.location.href = r.url;
        else window.open(r.url, "_blank", "noopener,noreferrer");
        definirAviso(
          r.aviso ?? "O envio por API não passou — a copy está escrita, é só carregar em enviar.",
        );
      } else {
        janela?.close();
        definirErro(r.message ?? "Não dá para disparar este lead.");
      }
      await fila.recarregar();
    } catch (e) {
      // Se o envio nem respondeu, ainda vale abrir a conversa com a copy pronta.
      try {
        const l = await api.linkDaConversa(actual.id, mensagem);
        if (janela) janela.location.href = l.url;
        definirAviso("Sem resposta do servidor no envio — a conversa vai aberta na mesma.");
        await fila.recarregar();
      } catch {
        janela?.close();
        definirErro(`Falha no disparo: ${e instanceof Error ? e.message : String(e)}`);
      }
    } finally {
      definirADisparar(false);
    }
  }, [actual, mensagem, aDisparar, fila]);

  const semTecto = (f?.estado.restantesHoje ?? 0) <= 0;
  const aEsperar = espera > 0;
  const progresso = f ? Math.min(100, Math.round((f.estado.enviadosHoje / Math.max(1, f.estado.tecto)) * 100)) : 0;

  return (
    <Cartao>
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-borda bg-fundo">
          <I.Conversa className="h-4 w-4 text-suave" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Fila de disparo</p>
          <p className="mt-0.5 text-xs text-suave">
            {fila.erro ? `Não consegui ler a fila: ${fila.erro}` : f ? f.resumo : "A montar a fila…"}
          </p>
        </div>
        <Botao pequeno variante="contorno" onClick={fila.recarregar} disabled={fila.aCarregar}>
          <I.Recarregar className={`h-3.5 w-3.5 ${fila.aCarregar ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Recarregar</span>
        </Botao>
      </div>

      {f && (
        <div className="mt-3 space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-fundo">
            <div className="h-full bg-marca/70 transition-all" style={{ width: `${progresso}%` }} />
          </div>
          <p className="font-mono text-[11px] text-suave">
            {f.estado.enviadosHoje} de {f.estado.tecto} hoje · {numero(f.elegiveis)} elegíveis na base
          </p>
          {f.motivosDeParte && (
            <p className="text-[11px] text-suave">
              {numero(f.postosDeParte)} de parte — {f.motivosDeParte}
            </p>
          )}
        </div>
      )}

      {actual && !semTecto && (
        <div className="mt-3 space-y-2.5 rounded-xl border border-borda bg-fundo/60 p-3">
          <div>
            <p className="text-sm font-semibold">{actual.empresa}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-suave">
              {(actual.cidade || actual.setor) && (
                <span>{[actual.cidade, actual.setor].filter(Boolean).join(" · ")}</span>
              )}
              <span className="font-mono">{actual.numeroFormatado ?? actual.numero}</span>
              {actual.decisor && (
                <span>
                  {actual.decisor.nome}
                  {actual.decisor.cargo && ` — ${actual.decisor.cargo}`}
                </span>
              )}
            </div>
          </div>

          <textarea
            value={mensagem}
            onChange={(e) => definirMensagem(e.target.value)}
            rows={7}
            className={`${campo} resize-y text-xs leading-relaxed`}
          />

          <div className="flex flex-wrap gap-2">
            <Botao pequeno onClick={disparar} disabled={aDisparar || aEsperar || !mensagem.trim()}>
              <I.Enviar className="h-4 w-4 rotate-90" />
              {aEsperar ? `Próximo em ${espera}s` : "Abrir WhatsApp e marcar"}
            </Botao>
            <Botao
              pequeno
              variante="contorno"
              onClick={() => definirSaltados((s) => [...s, actual.id])}
              disabled={aDisparar}
            >
              Saltar
            </Botao>
          </div>

          {aviso && <p className="text-[11px] leading-relaxed text-aviso">{aviso}</p>}
          {erro && <p className="text-[11px] text-alerta">{erro}</p>}

          <p className="text-[11px] leading-relaxed text-suave">
            O WhatsApp abre com a mensagem escrita e és tu que carregas em enviar. O lead fica marcado como
            contactado ao abrir — se fechares sem enviar, desmarca-o na ficha.
          </p>
        </div>
      )}

      {f && !actual && !semTecto && (
        <p className="mt-3 text-xs text-suave">
          {saltados.length
            ? "Saltaste todos os que havia. Recarrega para os trazer de volta."
            : "Sem ninguém elegível agora."}
        </p>
      )}
    </Cartao>
  );
}

/* --------------------------------------------------------- a lista do dia */

function FichaDoLead({ lead, aoMudar }: { lead: api.Lead; aoMudar: () => void }) {
  const [copy, definirCopy] = useState<{ texto: string; ia?: boolean } | null>(null);
  const [email, definirEmail] = useState<{ assunto: string; corpo: string; ia?: boolean } | null>(null);
  const [paraEmail, definirParaEmail] = useState("");
  const [ocupado, definirOcupado] = useState<string | null>(null);
  const [nota, definirNota] = useState<string | null>(null);
  const [erro, definirErro] = useState<string | null>(null);

  const sinais = sinaisDoLead(lead);

  async function gerarCopy() {
    definirErro(null);
    definirOcupado("copy");
    try {
      const r = await api.rascunhoDeMensagem(lead.id);
      definirCopy({ texto: r.message, ia: r.ai });
    } catch (e) {
      definirErro(`Falha ao gerar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      definirOcupado(null);
    }
  }

  async function dispararWhatsApp() {
    definirErro(null);
    definirNota(null);
    definirOcupado("whatsapp");
    const janela = window.open("about:blank", "_blank");
    try {
      let texto = copy?.texto;
      if (!texto) {
        const r = await api.rascunhoDeMensagem(lead.id);
        texto = r.message;
        definirCopy({ texto: r.message, ia: r.ai });
      }
      const r = await api.enviarWhatsApp(lead.id, texto);
      if (r.sent) {
        janela?.close();
        definirNota(`Enviado por WhatsApp — ${lead.businessName} recebeu a mensagem.`);
      } else if (r.url) {
        if (janela) janela.location.href = r.url;
        definirNota(r.aviso ?? "O envio por API não passou — a copy está escrita, é só carregar em enviar.");
      } else {
        janela?.close();
        definirErro(r.message ?? "Não dá para disparar este lead.");
      }
      aoMudar();
    } catch (e) {
      janela?.close();
      definirErro(`Falha no disparo: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      definirOcupado(null);
    }
  }

  async function gerarEmail() {
    definirErro(null);
    definirOcupado("rascunho-email");
    try {
      const r = await api.rascunhoDeEmail(lead.id);
      definirEmail({ assunto: r.subject, corpo: r.body, ia: r.ai });
    } catch (e) {
      definirErro(`Falha ao gerar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      definirOcupado(null);
    }
  }

  async function enviarEmail() {
    if (!email) return;
    const destino = paraEmail.trim();
    if (destino && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destino)) {
      definirErro("Email inválido. Verifica o endereço do destinatário.");
      return;
    }
    definirErro(null);
    definirNota(null);
    definirOcupado("envio-email");
    try {
      const r = await api.enviarEmail(lead.id, {
        subject: email.assunto,
        body: email.corpo,
        ...(destino ? { email: destino } : {}),
      });
      definirNota(`E-mail enviado para ${r.to ?? (destino || lead.email)}.`);
      aoMudar();
    } catch (e) {
      definirErro(`Falha ao enviar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      definirOcupado(null);
    }
  }

  async function registar(tipo: string, nome: string) {
    definirErro(null);
    try {
      await api.registarPedido(lead.id, tipo);
      definirNota(`Pedido registado: ${nome} para ${lead.businessName}.`);
    } catch (e) {
      definirErro(`Falha: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <li className="rounded-xl border border-borda bg-cartao p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{lead.businessName}</p>
          <p className="mt-0.5 text-xs text-suave">
            {lead.city} · {lead.niche}
          </p>
          <p className="mt-1 font-mono text-xs text-suave">{lead.whatsapp ?? lead.phone ?? "—"}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {sinais.map((s) => (
              <Selo key={s.texto} tom={s.tom}>
                {s.texto}
              </Selo>
            ))}
            {lead.ultimoWhatsApp && <Selo tom="marca">Contactado</Selo>}
          </div>
        </div>
        <Selo tom={lead.tier === "A" ? "marca" : "neutro"}>
          {lead.score} · {lead.tier}
        </Selo>
      </div>

      {copy && (
        <textarea
          value={copy.texto}
          onChange={(e) => definirCopy({ ...copy, texto: e.target.value })}
          rows={6}
          className={`${campo} mt-3 resize-y text-xs leading-relaxed`}
        />
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Botao pequeno variante="contorno" onClick={gerarCopy} disabled={ocupado !== null}>
          <I.Estrela className="h-3.5 w-3.5" />
          {ocupado === "copy" ? "a escrever…" : copy ? "Regerar copy" : "Preparar copy"}
        </Botao>
        <Botao pequeno onClick={dispararWhatsApp} disabled={ocupado !== null}>
          <I.Conversa className="h-3.5 w-3.5" />
          {ocupado === "whatsapp" ? "a abrir…" : "DISPARAR NO WHATSAPP"}
        </Botao>
        <Botao pequeno variante="contorno" onClick={gerarEmail} disabled={ocupado !== null}>
          <I.Caixa className="h-3.5 w-3.5" />
          {ocupado === "rascunho-email" ? "a escrever…" : "Preparar e-mail"}
        </Botao>
      </div>

      {email && (
        <div className="mt-3 space-y-2 rounded-xl border border-borda bg-fundo p-3">
          <p className="etiqueta">Revisar antes de enviar</p>
          <input
            className={campo}
            placeholder={lead.email ? `Email do destinatário (${lead.email})` : "Email do destinatário"}
            value={paraEmail}
            onChange={(e) => definirParaEmail(e.target.value)}
          />
          <input
            className={campo}
            placeholder="Assunto"
            value={email.assunto}
            onChange={(e) => definirEmail({ ...email, assunto: e.target.value })}
          />
          <textarea
            className={`${campo} min-h-32 resize-y`}
            placeholder="Mensagem"
            value={email.corpo}
            onChange={(e) => definirEmail({ ...email, corpo: e.target.value })}
          />
          <Botao pequeno onClick={enviarEmail} disabled={ocupado !== null}>
            {ocupado === "envio-email" ? "a enviar…" : "Enviar e-mail"}
          </Botao>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-borda pt-3">
        <span className="etiqueta mr-1">Registar pedido</span>
        {TIPOS_DE_PEDIDO.map((t) => (
          <button
            key={t.valor}
            type="button"
            onClick={() => registar(t.valor, t.nome)}
            className="rounded-lg border border-borda px-2 py-1 text-xs text-suave hover:bg-fundo"
          >
            {t.nome}
          </button>
        ))}
      </div>

      {nota && <p className="mt-2 text-xs leading-relaxed text-bom">{nota}</p>}
      {erro && <p className="mt-2 text-xs text-alerta">{erro}</p>}
    </li>
  );
}

export function Diario() {
  const leads = usarDados(() => api.leads(2000), { intervaloMs: 120_000 });
  const [mostrarContactados, definirMostrarContactados] = useState(false);
  const [quantos, definirQuantos] = useState(15);

  /**
   * A ordem do dia: primeiro a pontuação, e com a mesma pontuação vai primeiro
   * quem tem celular. Um fixo não recebe mensagem, e deixá-lo à frente de um
   * celular é gastar a vez do dia com quem não pode ser escrito.
   */
  const ordenados = useMemo(() => {
    const temCelular = (l: api.Lead) => {
      const d = String(l.whatsapp || l.phone || "").replace(/\D/g, "");
      const s = (d.startsWith("55") ? d.slice(2) : d).slice(2);
      return s.length === 9 && s.startsWith("9") ? 0 : 1;
    };
    return (leads.dados ?? [])
      .filter((l) => !l.optOutAt)
      .filter((l) => (mostrarContactados ? true : !l.ultimoWhatsApp))
      .sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        const ca = temCelular(a);
        const cb = temCelular(b);
        return ca !== cb ? ca - cb : b.id - a.id;
      });
  }, [leads.dados, mostrarContactados]);

  const jaContactados = (leads.dados ?? []).filter((l) => !l.optOutAt && l.ultimoWhatsApp).length;
  const tierA = ordenados.filter((l) => l.tier === "A").length;
  const comTelefone = ordenados.filter((l) => !!l.phone || !!l.whatsapp).length;

  return (
    <div className="space-y-4">
      <Interruptores aoMudar={leads.recarregar} />
      <FilaDeDisparo />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel Diário</h1>
          <p className="text-sm leading-relaxed text-suave">
            O teu plano de ataque para hoje. Empresas ordenadas pelo risco do setor e por conseguirmos
            falar com alguém.
          </p>
        </div>
        <Botao
          variante="contorno"
          pequeno
          onClick={() => definirMostrarContactados((m) => !m)}
          className={mostrarContactados ? "!border-marca !text-marca" : ""}
        >
          {mostrarContactados ? "A mostrar contactados" : "Mostrar já contactados"}
          {jaContactados > 0 && <span className="font-mono opacity-70">{jaContactados}</span>}
        </Botao>
      </div>

      <div className="flex flex-wrap gap-2">
        <Pastilha ok={null}>{numero(ordenados.length)} na lista</Pastilha>
        <Pastilha ok={null}>{numero(tierA)} tier A</Pastilha>
        <Pastilha ok={null}>{numero(comTelefone)} com telefone</Pastilha>
      </div>

      {leads.aCarregar && !leads.dados ? (
        <ACarregar>A montar o plano do dia…</ACarregar>
      ) : !ordenados.length ? (
        <Cartao>
          <p className="py-8 text-center text-sm text-suave">
            Não há leads pendentes para contactar hoje com os filtros atuais.
          </p>
        </Cartao>
      ) : (
        <>
          <ul className="space-y-3">
            {ordenados.slice(0, quantos).map((l) => (
              <FichaDoLead key={l.id} lead={l} aoMudar={leads.recarregar} />
            ))}
          </ul>
          {ordenados.length > quantos && (
            <div className="text-center">
              <Botao variante="contorno" onClick={() => definirQuantos((q) => q + 15)}>
                Mostrar mais {numero(Math.min(15, ordenados.length - quantos))}
              </Botao>
            </div>
          )}
        </>
      )}
    </div>
  );
}
