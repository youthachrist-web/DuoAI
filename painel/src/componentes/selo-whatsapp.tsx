import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import * as I from "../componentes/icones";

/**
 * O estado do WhatsApp, visível em todas as páginas.
 *
 * Existem cinco estados e eles não são o mesmo problema, por isso não podem dar
 * a mesma cor nem a mesma frase. O que mais importa é o quarto: a sessão está
 * ligada e mesmo assim os envios por API são recusados. Isso não é o QR — voltar
 * a emparelhar não resolve nada, e já se perderam dias a tentar. Nesse caso o
 * disparo abre um link wa.me com a copy pronta e a mensagem sai do telemóvel,
 * que continua a enviar sem problema.
 */
export function SeloWhatsApp() {
  const { dados, aCarregar } = usarDados(api.estadoWhatsApp, { intervaloMs: 60_000 });

  const ligado = dados?.state === "open";
  const pelaMeta = dados?.canal === "meta-cloud";
  const aEnviarPorApi = dados?.ok === true && (ligado || pelaMeta);
  const soLink = ligado && dados?.ok === false;
  const desde = dados?.since ? new Date(dados.since) : null;

  const explicacao = aCarregar
    ? "A verificar a ligação do WhatsApp…"
    : !dados
      ? "Não consegui verificar a ligação do WhatsApp"
      : aEnviarPorApi
        ? pelaMeta
          ? "WhatsApp pela API oficial da Meta — sem aparelho ligado e sem emparelhamento. Não há QR para ler."
          : `WhatsApp ligado${desde ? ` desde ${desde.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}` : ""} · o disparo envia por API`
        : soLink
          ? `Sessão ligada, mas o WhatsApp está a recusar os envios por API. NÃO é o QR — voltar a emparelhar não resolve. O disparo abre um link wa.me com a copy pronta e a mensagem sai do teu telemóvel, que continua a enviar normalmente.${
              dados.envios?.recusasSeguidas ? ` (${dados.envios.recusasSeguidas} recusas seguidas)` : ""
            }`
          : `WhatsApp desligado — ${dados.detail ?? "lê o QR no Painel Diário"}`;

  const cor = aEnviarPorApi
    ? "border-turquesa/40 bg-turquesa-tenue text-turquesa"
    : aCarregar || !dados
      ? "border-borda bg-fundo text-suave"
      : "border-aviso/40 bg-aviso-tenue text-aviso";

  const curto = aCarregar
    ? "a verificar"
    : !dados
      ? "sem resposta"
      : aEnviarPorApi
        ? pelaMeta
          ? "meta"
          : "por api"
        : soLink
          ? "só link"
          : "desligado";

  return (
    <span
      title={explicacao}
      aria-label={explicacao}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${cor}`}
    >
      <I.Conversa className={`h-3 w-3 ${aCarregar ? "animate-pulse" : ""}`} />
      {curto}
    </span>
  );
}
