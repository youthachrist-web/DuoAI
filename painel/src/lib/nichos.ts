import type { ComponentType, SVGProps } from "react";
import * as I from "../componentes/icones";

/**
 * Os setores que o sistema varre, na ordem em que o painel os mostra.
 *
 * `nome` é o que a base guarda e o que o servidor espera receber; `curto` é o
 * que cabe num filtro de telemóvel. Trocar o `nome` partia a prospeção em
 * silêncio, por isso ficam os dois. A ordem não é alfabética de propósito: é a
 * ordem em que estas frentes foram abertas, e é assim que ele já a conhece.
 */
export type Setor = {
  nome: string;
  curto: string;
  Icone: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
};

export const SETORES: Setor[] = [
  { nome: "Clínicas de Medicina Ocupacional", curto: "Medicina Ocupacional", Icone: I.Estetoscopio },
  { nome: "Clínicas Médicas e Ambulatórios", curto: "Clínicas e Ambulatórios", Icone: I.Coracao },
  { nome: "Fisioterapia e Reabilitação", curto: "Fisioterapia", Icone: I.Actividade },
  { nome: "Estaleiros Navais", curto: "Estaleiros Navais", Icone: I.Navio },
  { nome: "Serviços Portuários e Estiva", curto: "Portuário e Estiva", Icone: I.Ancora },
  { nome: "Metalurgia e Fundição", curto: "Metalurgia e Fundição", Icone: I.Chama },
  { nome: "Estruturas Metálicas e Carpintaria", curto: "Estruturas e Carpintaria", Icone: I.Martelo },
  { nome: "Indústria Química e Farmacêutica", curto: "Química e Farmacêutica", Icone: I.Balao },
  { nome: "Extração e Pedreiras", curto: "Extração e Pedreiras", Icone: I.Montanha },
  { nome: "Indústria Papeleira e Celulose", curto: "Papel e Celulose", Icone: I.Pergaminho },
  { nome: "Gestão de Resíduos e Limpeza Urbana", curto: "Resíduos e Limpeza", Icone: I.Reciclar },
  { nome: "Construção Civil e Obras Públicas", curto: "Construção Civil", Icone: I.Capacete },
  { nome: "Logística e Armazéns", curto: "Logística e Armazéns", Icone: I.Armazem },
  { nome: "Transporte de Cargas e Ferroviário", curto: "Transporte de Cargas", Icone: I.Camiao },
  { nome: "Manutenção Industrial e Eletromecânica", curto: "Manutenção Industrial", Icone: I.Chave },
  { nome: "Setor Alimentar Industrial", curto: "Alimentar Industrial", Icone: I.Talher },
  { nome: "Academias", curto: "Academias", Icone: I.Halteres },
  { nome: "Indústria Transformadora e Metalomecânica", curto: "Indústria Transformadora", Icone: I.Fabrica },
];

export const CIDADES = [
  "Joinville",
  "Blumenau",
  "Itajaí",
  "Navegantes",
  "Balneário Camboriú",
  "Penha",
  "Barra Velha",
  "Camboriú",
  "Porto Belo",
  "Itapema",
  "Balneário Piçarras",
  "Tijucas",
  "Itapoá",
  "Araquari",
  "Guabiruba",
  "Brusque",
  "Antônio Carlos",
  "Biguaçu",
  "São José",
  "Palhoça",
  "Florianópolis",
  "São Paulo",
  "Canoas",
  "Gravataí",
  "Cachoeirinha",
  "Sapucaia do Sul",
] as const;

/** Os pedidos que um lead pode fazer, e que ficam registados na ficha dele. */
export const TIPOS_DE_PEDIDO = [
  { valor: "exames_complementares", nome: "Exames complementares" },
  { valor: "colheita_local", nome: "Colheita no local" },
  { valor: "saude_ocupacional", nome: "Saúde ocupacional (ASO)" },
  { valor: "tabela_parceria", nome: "Tabela de parceria" },
  { valor: "agendamento", nome: "Agendamento prioritário" },
] as const;

/** Os gargalos que a análise atribui a cada lead. */
export const GARGALOS: Record<string, string> = {
  conformidade: "Conformidade legal e SST",
  parceria: "Parceria (clínicas)",
  absentismo: "Absentismo / crescimento",
  beneficios: "Benefícios e retenção",
  logistica: "Logística de exames",
  "sem-analise": "Sem análise ainda",
};
