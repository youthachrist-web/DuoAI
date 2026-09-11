import { useMemo, useState } from "react";
import { usarDados } from "../lib/usar-dados";
import * as api from "../lib/api";
import { numero, data } from "../lib/formatar";
import { Cartao, Vazio } from "../componentes/base";

export function Leads() {
  const lista = usarDados(() => api.leads(1000), { intervaloMs: 120_000 });
  const facetas = usarDados(api.facetas, { intervaloMs: 120_000 });
  const [procura, definirProcura] = useState("");
  const [cidade, definirCidade] = useState("");
  const [setor, definirSetor] = useState("");
  const [soComContacto, definirSoComContacto] = useState(false);

  const filtrados = useMemo(() => {
    const p = procura.trim().toLowerCase();
    return (lista.dados ?? []).filter((l) => {
      if (cidade && l.city !== cidade) return false;
      if (setor && l.niche !== setor) return false;
      if (soComContacto && !l.whatsapp && !l.phone) return false;
      if (!p) return true;
      return (
        l.businessName.toLowerCase().includes(p) ||
        (l.email ?? "").toLowerCase().includes(p) ||
        (l.phone ?? "").includes(p) ||
        (l.whatsapp ?? "").includes(p)
      );
    });
  }, [lista.dados, procura, cidade, setor, soComContacto]);

  const campo =
    "rounded-lg border border-borda bg-cartao px-3 py-2 text-sm outline-none focus:border-marca";

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className={campo}
          placeholder="Procurar por nome, email ou número"
          value={procura}
          onChange={(e) => definirProcura(e.target.value)}
        />
        <select className={campo} value={cidade} onChange={(e) => definirCidade(e.target.value)}>
          <option value="">Todas as cidades</option>
          {facetas.dados?.cities.map((c) => (
            <option key={c.value} value={c.value}>
              {c.value} ({c.count})
            </option>
          ))}
        </select>
        <select className={campo} value={setor} onChange={(e) => definirSetor(e.target.value)}>
          <option value="">Todos os setores</option>
          {facetas.dados?.sectors.map((s) => (
            <option key={s.value} value={s.value}>
              {s.value} ({s.count})
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-1 text-sm">
          <input
            type="checkbox"
            checked={soComContacto}
            onChange={(e) => definirSoComContacto(e.target.checked)}
            className="h-4 w-4 accent-marca"
          />
          Só com telefone ou WhatsApp
        </label>
      </div>

      <Cartao
        titulo={`${numero(filtrados.length)} de ${numero(lista.dados?.length ?? 0)} leads`}
        className="overflow-hidden"
      >
        {lista.aCarregar && !lista.dados ? (
          <Vazio>a ler os leads…</Vazio>
        ) : filtrados.length === 0 ? (
          <Vazio>Nenhum lead corresponde a estes filtros.</Vazio>
        ) : (
          <div className="-mx-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-borda text-left text-xs text-suave">
                  <th className="px-4 py-2 font-medium">Empresa</th>
                  <th className="px-3 py-2 font-medium">Cidade</th>
                  <th className="px-3 py-2 font-medium">Setor</th>
                  <th className="px-3 py-2 font-medium">Contacto</th>
                  <th className="px-3 py-2 text-right font-medium">Pontos</th>
                  <th className="px-4 py-2 font-medium">Falámos</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.slice(0, 300).map((l) => (
                  <tr key={l.id} className="border-b border-borda/60 last:border-0">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{l.businessName}</p>
                      {l.email && <p className="text-xs text-suave">{l.email}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-suave">{l.city}</td>
                    <td className="px-3 py-2.5 text-xs text-suave">{l.niche}</td>
                    <td className="px-3 py-2.5 tabular-nums text-suave">
                      {l.whatsapp ?? l.phone ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{l.score}</td>
                    <td className="px-4 py-2.5 text-suave">{data(l.lastContactedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtrados.length > 300 && (
              <p className="px-4 pt-3 text-xs text-suave">
                A mostrar os primeiros 300. Afina os filtros para veres os restantes.
              </p>
            )}
          </div>
        )}
      </Cartao>
    </div>
  );
}
