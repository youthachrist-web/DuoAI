import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * A rede que apanha um erro do painel antes de o ecrã ficar branco.
 *
 * Um ecrã em branco não diz nada e assusta: parece que os dados se perderam. Não
 * se perderam — estão no servidor, e o painel é só a janela. É isso que este
 * cartão diz, e por isso existe.
 *
 * O erro é reportado ao servidor para ficar registado. Se o envio falhar, não se
 * insiste: a prioridade é o utilizador ver a mensagem, não a telemetria chegar.
 */
export class CaixaDeErro extends Component<{ children: ReactNode }, { erro: Error | null }> {
  state: { erro: Error | null } = { erro: null };

  static getDerivedStateFromError(erro: Error) {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    const corpo = JSON.stringify({
      message: erro.message,
      stack: erro.stack ?? "",
      componentStack: info.componentStack ?? "",
      url: window.location.href,
      route: window.location.pathname,
      userAgent: navigator.userAgent,
    });
    try {
      // sendBeacon sobrevive a um recarregamento; o fetch é o plano B.
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/client-errors", new Blob([corpo], { type: "application/json" }));
      } else {
        void fetch("/api/client-errors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: corpo,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* reportar é um extra; nunca pode ser a razão de nada rebentar aqui */
    }
  }

  async limparTudo() {
    try {
      const registos = await navigator.serviceWorker?.getRegistrations?.();
      await Promise.all((registos ?? []).map((r) => r.unregister()));
      if ("caches" in window) {
        const nomes = await caches.keys();
        await Promise.all(nomes.map((n) => caches.delete(n)));
      }
    } catch {
      /* se não der para limpar, recarregar à mesma é melhor do que ficar preso */
    }
    window.location.reload();
  }

  render() {
    if (!this.state.erro) return this.props.children;

    return (
      <div className="grid min-h-[100dvh] place-items-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-borda bg-cartao p-6">
          <h1 className="text-lg font-bold">O painel encontrou um erro</h1>
          <p className="mt-1 text-sm leading-relaxed text-suave">
            Nada foi perdido — os dados estão no servidor. Já ficou reportado.
          </p>
          <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl bg-fundo p-3 font-mono text-xs text-suave">
            {this.state.erro.message}
          </pre>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-turquesa px-4 py-2.5 text-sm font-semibold text-white hover:bg-turquesa-forte"
            >
              Tentar de novo
            </button>
            <button
              type="button"
              onClick={() => void this.limparTudo()}
              className="rounded-xl border border-borda px-4 py-2.5 text-sm font-semibold hover:bg-fundo"
            >
              Limpar memória e recarregar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
