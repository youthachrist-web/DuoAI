/**
 * As cidades e os setores que o sistema varre.
 *
 * Os nomes longos são os que a base guarda e os que o servidor espera receber;
 * os curtos servem para caber num filtro do telemóvel sem cortar. Trocá-los
 * partia a prospeção em silêncio, por isso ficam os dois.
 */

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

export type Setor = { nome: string; curto: string };

export const SETORES: Setor[] = [
  { nome: "Metalurgia e Fundição", curto: "Metalurgia" },
  { nome: "Construção Civil e Obras Públicas", curto: "Construção Civil" },
  { nome: "Indústria Transformadora e Metalomecânica", curto: "Indústria Transformadora" },
  { nome: "Estruturas Metálicas e Carpintaria", curto: "Estruturas e Carpintaria" },
  { nome: "Logística e Armazéns", curto: "Logística e Armazéns" },
  { nome: "Transporte de Cargas e Ferroviário", curto: "Transporte de Cargas" },
  { nome: "Manutenção Industrial e Eletromecânica", curto: "Manutenção Industrial" },
  { nome: "Setor Alimentar Industrial", curto: "Alimentar Industrial" },
  { nome: "Gestão de Resíduos e Limpeza Urbana", curto: "Resíduos e Limpeza" },
  { nome: "Indústria Química e Farmacêutica", curto: "Química e Farmacêutica" },
  { nome: "Estaleiros Navais", curto: "Estaleiros Navais" },
  { nome: "Serviços Portuários e Estiva", curto: "Portuário e Estiva" },
  { nome: "Indústria Papeleira e Celulose", curto: "Papel e Celulose" },
  { nome: "Extração e Pedreiras", curto: "Extração e Pedreiras" },
  { nome: "Clínicas Médicas e Ambulatórios", curto: "Clínicas e Ambulatórios" },
  { nome: "Clínicas de Medicina Ocupacional", curto: "Medicina Ocupacional" },
  { nome: "Fisioterapia e Reabilitação", curto: "Fisioterapia" },
  { nome: "Academias", curto: "Academias" },
];

/** Os pedidos que um lead pode fazer, e que ficam registados na ficha dele. */
export const TIPOS_DE_PEDIDO = [
  { valor: "saude_ocupacional", nome: "Saúde ocupacional (ASO)" },
  { valor: "exames_complementares", nome: "Exames complementares" },
  { valor: "colheita_local", nome: "Colheita no local" },
  { valor: "agendamento_prioritario", nome: "Agendamento prioritário" },
  { valor: "tabela_parceria", nome: "Tabela de parceria" },
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
