import { useCallback, useEffect, useRef, useState } from "react";

type Estado<T> = { dados: T | null; aCarregar: boolean; erro: string | null };

/**
 * Lê da API e volta a ler de x em x tempo.
 *
 * Guarda os dados anteriores enquanto recarrega, de propósito: um painel que se
 * esvazia a cada dez segundos é ilegível, e o que estava no ecrã continua
 * verdadeiro até chegar coisa melhor.
 */
export function usarDados<T>(
  buscar: () => Promise<T>,
  opcoes: { intervaloMs?: number; dependencias?: unknown[] } = {},
) {
  const { intervaloMs, dependencias = [] } = opcoes;
  const [estado, definir] = useState<Estado<T>>({ dados: null, aCarregar: true, erro: null });
  const guardado = useRef(buscar);
  guardado.current = buscar;

  const recarregar = useCallback(async () => {
    try {
      const dados = await guardado.current();
      definir({ dados, aCarregar: false, erro: null });
    } catch (e) {
      definir((anterior) => ({
        dados: anterior.dados,
        aCarregar: false,
        erro: e instanceof Error ? e.message : String(e),
      }));
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    definir((a) => ({ ...a, aCarregar: a.dados === null }));
    void recarregar();
    if (!intervaloMs) return;
    const t = setInterval(() => {
      // Não vale gastar pedidos com o separador escondido.
      if (vivo && document.visibilityState === "visible") void recarregar();
    }, intervaloMs);
    return () => {
      vivo = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recarregar, intervaloMs, ...dependencias]);

  return { ...estado, recarregar };
}
