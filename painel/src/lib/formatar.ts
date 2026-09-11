/** Formatações que aparecem em mais do que um sítio. */

export function numero(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("pt-BR");
}

export function dinheiro(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function quandoFoi(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const minutos = Math.round((Date.now() - d.getTime()) / 60000);
  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return d.toLocaleDateString("pt-BR");
}

export function data(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}
