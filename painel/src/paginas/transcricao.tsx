import { useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";
import { quandoFoi } from "../lib/formatar";
import { ACarregar, Aviso, Botao, Cabecalho, Cartao, Selo, Vazio, campo } from "../componentes/base";

function Texto({ t }: { t: api.Transcricao }) {
  const [copiado, definirCopiado] = useState(false);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="etiqueta">
          {t.language ?? "pt"}
          {t.createdAt && ` · ${quandoFoi(t.createdAt)}`}
        </span>
        <Botao
          pequeno
          variante="contorno"
          onClick={async () => {
            await navigator.clipboard.writeText(t.text ?? "");
            definirCopiado(true);
            setTimeout(() => definirCopiado(false), 1800);
          }}
        >
          {copiado ? "copiado" : "copiar"}
        </Botao>
      </div>
      <p className="whitespace-pre-wrap rounded-xl bg-fundo p-3 text-sm leading-relaxed">{t.text}</p>
    </div>
  );
}

export function Transcricao() {
  const historico = usarDados(api.historicoDeTranscricoes, { intervaloMs: 120_000 });
  const [url, definirUrl] = useState("");
  const [ocupado, definirOcupado] = useState<"ficheiro" | "url" | null>(null);
  const [erro, definirErro] = useState<string | null>(null);
  const [ultima, definirUltima] = useState<api.Transcricao | null>(null);

  async function porFicheiro(ficheiro: File) {
    definirErro(null);
    definirOcupado("ficheiro");
    try {
      const t = await api.transcreverFicheiro(ficheiro);
      definirUltima(t);
      await historico.recarregar();
    } catch (e) {
      definirErro(`Erro na transcrição: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      definirOcupado(null);
    }
  }

  async function porUrl() {
    if (!url.trim()) return;
    definirErro(null);
    definirOcupado("url");
    try {
      const t = await api.transcreverPorUrl(url.trim());
      definirUltima(t);
      definirUrl("");
      await historico.recarregar();
    } catch (e) {
      definirErro(`Erro na transcrição por URL: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      definirOcupado(null);
    }
  }

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Transcrição de Voz"
        descricao="Passa uma mensagem de voz a texto, para responder sem ter de a ouvir três vezes."
      />

      {erro && <Aviso tom="erro">{erro}</Aviso>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Carregar ficheiro de áudio">
          <label className="block cursor-pointer rounded-xl border border-dashed border-borda p-6 text-center hover:bg-fundo">
            <I.Telemovel className="mx-auto h-7 w-7 text-tenue" />
            <p className="mt-2 text-sm font-medium">
              {ocupado === "ficheiro" ? "A transcrever…" : "Clica para selecionar áudio"}
            </p>
            <p className="mt-1 text-xs text-suave">MP3, WAV, OGG, M4A, WEBM — máximo 25 MB</p>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              disabled={ocupado !== null}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void porFicheiro(f);
                e.target.value = "";
              }}
            />
          </label>
        </Cartao>

        <Cartao titulo="Transcrever por URL">
          <p className="mb-2 text-xs leading-relaxed text-suave">
            Ideal para mensagens de voz do WhatsApp, quando tens o endereço do ficheiro.
          </p>
          <input
            className={campo}
            placeholder="https://exemplo.com/audio.ogg"
            value={url}
            onChange={(e) => definirUrl(e.target.value)}
          />
          <div className="mt-2">
            <Botao onClick={porUrl} disabled={!url.trim() || ocupado !== null}>
              <I.Enviar className="h-4 w-4 rotate-90" />
              {ocupado === "url" ? "a transcrever…" : "Transcrever URL"}
            </Botao>
          </div>
        </Cartao>
      </div>

      {ultima && (
        <Cartao titulo="Última transcrição" accao={<Selo tom="bom">concluída</Selo>}>
          <Texto t={ultima} />
        </Cartao>
      )}

      <Cartao
        titulo="Histórico"
        accao={<span className="etiqueta">{historico.dados?.length ?? 0}</span>}
      >
        {!historico.dados ? (
          <ACarregar />
        ) : !historico.dados.length ? (
          <Vazio>Nenhuma transcrição ainda. Carrega um ficheiro de áudio acima.</Vazio>
        ) : (
          <ul className="space-y-4">
            {historico.dados.map((t) => (
              <li key={t.id} className="border-b border-borda/60 pb-4 last:border-0 last:pb-0">
                <Texto t={t} />
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      <p className="text-center text-xs text-tenue">Transcrito pelo Whisper, no gateway multimodal.</p>
    </div>
  );
}
