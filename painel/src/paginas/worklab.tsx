import { useState } from "react";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { numero } from "../lib/formatar";
import { Aviso, Cabecalho, Cartao, Selo, campo } from "../componentes/base";

const TIPOS = [
  {
    id: "reativacao",
    rotulo: "1 · Reativação da base",
    nota: "Traz de volta quem não faz exame há tempo. Recomenda o pack e o valor no Pix.",
  },
  {
    id: "confirmacao",
    rotulo: "2 · Confirmação de agendamento",
    nota: "Precisa das colunas «data da consulta» e «hora». Mensagem transacional, sem oferta.",
  },
  {
    id: "resultado",
    rotulo: "3 · Resultado disponível",
    nota: "Avisa que o resultado saiu. Precisa do link do portal (ou de uma coluna «link»).",
  },
] as const;

type Tipo = (typeof TIPOS)[number]["id"];

function Paciente({ m, indice }: { m: api.MensagemWorklab; indice: number }) {
  const [texto, definirTexto] = useState(m.text);
  const [aberto, definirAberto] = useState(false);

  // Se o texto foi mudado à mão, o link tem de levar o texto novo, não o original.
  const url = (() => {
    if (!m.whatsappUrl) return null;
    if (texto === m.text) return m.whatsappUrl;
    return `${m.whatsappUrl.split("?")[0]}?text=${encodeURIComponent(texto)}`;
  })();

  if (m.blocked) {
    return (
      <li className="rounded-xl border border-alerta/40 bg-alerta/5 p-3.5">
        <p className="font-semibold">{m.name || "(sem nome)"}</p>
        {m.phone && <p className="font-mono text-xs text-suave">{m.phone}</p>}
        <p className="mt-1.5 text-sm text-alerta">{m.blocked}</p>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-borda p-3.5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-semibold">{m.name || "(sem nome)"}</span>
        {m.phone && <span className="font-mono text-xs text-suave">{m.phone}</span>}
        {m.kind === "confirmacao" ? (
          <Selo tom="marca">Confirmação</Selo>
        ) : (
          <Selo tom={m.track === "alerta" ? "aviso" : "marca"}>
            {m.track === "alerta" ? "Alerta" : "Rotina"}
          </Selo>
        )}
        {m.kind === "reativacao" && m.track === "rotina" && m.pack && (
          <span className="text-xs text-suave">
            {m.pack} · R$ {m.packPrice},00
          </span>
        )}
      </div>

      <textarea
        className={`${campo} min-h-36 resize-y font-mono text-sm`}
        value={texto}
        onChange={(e) => definirTexto(e.target.value)}
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <a
          href={url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => url && definirAberto(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold ${
            aberto ? "border border-borda text-suave" : "bg-marca text-white hover:bg-marca-forte"
          } ${url ? "" : "pointer-events-none opacity-50"}`}
        >
          <I.Conversa className="h-4 w-4" />
          {aberto ? "Aberto no WhatsApp" : "Abrir no WhatsApp"}
        </a>
        {texto !== m.text && <span className="text-xs text-suave">texto alterado por ti</span>}
      </div>
      <p className="mt-1.5 text-xs text-tenue">
        Nº {indice + 1} — o WhatsApp abre já preenchido; és tu que confirmas o envio.
      </p>
    </li>
  );
}

export function Worklab() {
  const [tipo, definirTipo] = useState<Tipo>("reativacao");
  const [links, definirLinks] = useState<api.LinksWorklab>({});
  const [aProcessar, definirAProcessar] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);
  const [base, definirBase] = useState<api.BaseWorklab | null>(null);

  const mudarLink = (chave: keyof api.LinksWorklab) => (v: string) =>
    definirLinks((l) => ({ ...l, [chave]: v }));

  async function processar(ficheiro: File) {
    definirErro(null);
    definirBase(null);
    definirAProcessar(true);
    try {
      definirBase(await api.enviarBaseWorklab(ficheiro, tipo, links));
    } catch (e) {
      definirErro(`Não foi possível processar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      definirAProcessar(false);
    }
  }

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Base Worklab · B2C"
        descricao="Envia a planilha exportada do Worklab. O DuoAI lê nome, telefone, último exame e queixa, escolhe o pack e escreve a mensagem — tu revês e disparas pelo teu WhatsApp."
      />

      {erro && <Aviso tom="erro">{erro}</Aviso>}

      <Cartao titulo="1 · Escolher a mensagem">
        <div className="grid gap-2 sm:grid-cols-3">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => definirTipo(t.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                tipo === t.id ? "border-marca bg-marca-tenue" : "border-borda hover:bg-fundo"
              }`}
            >
              <p className="text-sm font-semibold">{t.rotulo}</p>
              <p className="mt-1 text-xs leading-relaxed text-suave">{t.nota}</p>
            </button>
          ))}
        </div>
      </Cartao>

      <Cartao titulo="2 · Enviar a planilha">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="etiqueta">Link de agendamento FourLife</span>
            <input
              className={`${campo} mt-1`}
              placeholder="https://…/agendar"
              value={links.labLink ?? ""}
              onChange={(e) => mudarLink("labLink")(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="etiqueta">Link do especialista (Zapvida)</span>
            <input
              className={`${campo} mt-1`}
              placeholder="https://zapvida…"
              value={links.specialistLink ?? ""}
              onChange={(e) => mudarLink("specialistLink")(e.target.value)}
            />
          </label>
          {tipo === "resultado" && (
            <label className="block">
              <span className="etiqueta">Link do resultado (portal do paciente)</span>
              <input
                className={`${campo} mt-1`}
                placeholder="https://…/resultado"
                value={links.resultLink ?? ""}
                onChange={(e) => mudarLink("resultLink")(e.target.value)}
              />
            </label>
          )}
          {tipo === "confirmacao" && (
            <label className="block">
              <span className="etiqueta">Link de reagendamento</span>
              <input
                className={`${campo} mt-1`}
                placeholder="https://…/reagendar"
                value={links.rescheduleLink ?? ""}
                onChange={(e) => mudarLink("rescheduleLink")(e.target.value)}
              />
            </label>
          )}
        </div>

        <label className="mt-4 block cursor-pointer rounded-xl border border-dashed border-borda p-6 text-center hover:bg-fundo">
          <I.Enviar className="mx-auto h-7 w-7 text-tenue" />
          <p className="mt-2 text-sm font-medium">
            {aProcessar ? "A processar…" : "Escolher ficheiro CSV do Worklab"}
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={aProcessar}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void processar(f);
              e.target.value = "";
            }}
          />
        </label>

        <p className="mt-3 text-xs leading-relaxed text-suave">
          As mensagens falam de sintomas e de prevenção, nunca do exame em si. Os dados de saúde não
          saem daqui e não entram em nenhuma lista de prospeção.
        </p>
      </Cartao>

      {base && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-borda bg-cartao p-4">
              <p className="etiqueta">Pacientes</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{numero(base.total)}</p>
            </div>
            <div className="rounded-2xl border border-borda bg-cartao p-4">
              <p className="etiqueta !text-marca">Prontos</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-marca">{numero(base.sendable)}</p>
            </div>
            <div className="rounded-2xl border border-borda bg-cartao p-4">
              <p className="etiqueta !text-alerta">Bloqueados</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{numero(base.blocked)}</p>
            </div>
          </div>

          <Cartao
            titulo="3 · Revisar e disparar"
            etiqueta="nada sai automaticamente"
          >
            <ul className="space-y-3">
              {base.messages.map((m, i) => (
                <Paciente key={`${m.phone ?? m.name}-${i}`} m={m} indice={i} />
              ))}
            </ul>
          </Cartao>
        </>
      )}
    </div>
  );
}
