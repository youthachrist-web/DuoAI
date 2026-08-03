// Catálogo real de packs LabDuo (fonte: Packs_LabDuo_2026.docx), usado pela frente B2C
// para recomendar o pack certo a partir da queixa/histórico do lead.

const PACKS = [
  {
    id: "essencial",
    nome: "LabDuo Essencial",
    pix: 149.0,
    tags: ["geral", "checkup", "prevenção"],
    chamada: "Um check-up completo de entrada, no seu tempo.",
    exames: [
      "Hemograma completo", "Glicose", "Hemoglobina glicada", "Colesterol total e frações",
      "Triglicerídeos", "Creatinina", "Ureia", "TGO", "TGP", "Gama GT", "TSH", "Urina tipo 1",
    ],
  },
  {
    id: "mulher",
    nome: "LabDuo Mulher",
    pix: 249.0,
    tags: ["mulher", "hormonal", "cansaço", "tireoide", "ciclo", "cabelo"],
    chamada: "Um cuidado completo para todas as fases da mulher.",
    exames: [
      "Hemograma completo", "Glicose", "Hemoglobina glicada", "Colesterol total e frações",
      "Triglicerídeos", "Creatinina", "TGO", "TGP", "Gama GT", "TSH", "T4 livre", "Ferro sérico",
      "Ferritina", "Vitamina B12", "Vitamina D", "Urina tipo 1", "FSH + estradiol", "Prolactina",
    ],
  },
  {
    id: "homem",
    nome: "LabDuo Homem",
    pix: 179.0,
    tags: ["homem", "checkup", "prevenção"],
    chamada: "Cuidado completo, no seu ritmo.",
    exames: [
      "Hemograma completo", "Glicose", "Hemoglobina glicada", "Colesterol total e frações",
      "Triglicerídeos", "Creatinina", "Ureia", "Ácido úrico", "TGO", "TGP", "Gama GT", "TSH",
      "Testosterona total, livre e calculada", "PSA livre e total", "Urina tipo 1",
    ],
  },
  {
    id: "cardiometabolico",
    nome: "LabDuo CardioMetabólico",
    pix: 249.0,
    tags: ["cansaço", "risco metabólico", "peso", "energia", "pressão"],
    chamada: "Vá além do básico e conheça seu risco cardiometabólico.",
    exames: [
      "Hemograma completo", "Glicose", "Hemoglobina glicada", "Insulina de jejum",
      "Colesterol total e frações", "Triglicerídeos", "Apolipoproteína B", "Lipoproteína(a)",
      "Proteína C reativa ultrassensível", "Creatinina", "Ureia", "TGO", "TGP", "Gama GT",
      "Ácido úrico", "TSH", "Cálculo do HOMA-IR",
    ],
  },
  {
    id: "performance",
    nome: "LabDuo Performance e Vitalidade",
    pix: 259.0,
    tags: ["energia", "treino", "vitamina", "fadiga", "recuperação"],
    chamada: "Acompanhe seus indicadores para treinar, recuperar e evoluir melhor.",
    exames: [
      "Hemograma completo", "Glicose", "Hemoglobina glicada", "Colesterol total e frações",
      "Triglicerídeos", "Creatinina", "Ureia", "TGO", "TGP", "Gama GT", "CK/CPK", "Sódio",
      "Potássio", "Magnésio", "Cálcio total", "Ferro sérico", "Ferritina", "Vitamina B12",
      "Vitamina D", "TSH", "T4 livre", "Proteína C reativa ultrassensível", "Urina tipo 1",
    ],
  },
  {
    id: "mounjaro",
    nome: "LabDuo Mounjaro – Acompanhamento Metabólico",
    pix: 329.0,
    tags: ["mounjaro", "glp-1", "emagrecimento", "metabólico", "medicação"],
    chamada: "Acompanhamento completo para quem está em tratamento metabólico.",
    exames: [
      "Hemograma completo", "Glicose", "Hemoglobina glicada", "Insulina de jejum",
      "Colesterol total e frações", "Triglicerídeos", "Creatinina", "Ureia", "Sódio", "Potássio",
      "Magnésio", "TGO", "TGP", "Gama GT", "Fosfatase alcalina", "Bilirrubina total e frações",
      "Amilase", "Lipase", "Ácido úrico", "TSH", "T4 livre", "Ferro sérico", "Ferritina",
      "Vitamina B12", "Vitamina D", "Proteínas totais e frações", "Urina tipo 1",
      "Cálculo do HOMA-IR",
    ],
  },
  {
    id: "infantil",
    nome: "LabDuo Infantil",
    pix: 179.0,
    tags: ["criança", "infantil", "crescimento", "pediatra"],
    chamada: "Crescer com saúde começa com cuidado e prevenção.",
    exames: [
      "Hemograma completo", "Glicose", "Colesterol total e frações", "Triglicerídeos",
      "Creatinina", "TGO", "TGP", "Ferro sérico", "Ferritina", "Vitamina B12", "Vitamina D",
      "Cálcio total", "TSH", "Urina tipo 1", "Parasitológico de fezes",
    ],
  },
  {
    id: "atleta",
    nome: "LabDuo Atleta",
    pix: 259.0,
    tags: ["atleta", "academia", "treino", "energia", "personal"],
    chamada: "Performance de verdade começa com dados de verdade.",
    exames: [
      "Hemograma completo", "Glicose", "Hemoglobina glicada", "Colesterol total e frações",
      "Triglicerídeos", "Creatinina", "Ureia", "TGO", "TGP", "Gama GT", "CK/CPK", "Sódio",
      "Potássio", "Magnésio", "Cálcio total", "Ferro sérico", "Ferritina", "Vitamina B12",
      "Vitamina D", "TSH", "T4 livre", "Proteína C reativa ultrassensível", "Urina tipo 1",
    ],
  },
  {
    id: "melhor-idade",
    nome: "LabDuo Melhor Idade 60+",
    pix: 299.0,
    tags: ["idoso", "60+", "cansaço", "crônico", "polifarmácia"],
    chamada: "Mais cuidado, autonomia e qualidade de vida em todas as fases.",
    exames: [
      "Hemograma completo", "Glicose", "Hemoglobina glicada", "Colesterol total e frações",
      "Triglicerídeos", "Creatinina com estimativa da taxa de filtração glomerular", "Ureia",
      "Sódio", "Potássio", "Magnésio", "Cálcio total", "TGO", "TGP", "Gama GT",
      "Fosfatase alcalina", "Proteínas totais e frações", "Albumina", "TSH", "T4 Livre",
      "Ferro sérico", "Ferritina", "Vitamina B12", "Vitamina D", "Ácido úrico", "Urina tipo 1",
      "Pesquisa de sangue oculto nas fezes", "PSA livre e total (se for homem)",
    ],
  },
];

/**
 * Escolhe o pack com maior número de tags batendo na queixa/histórico do lead.
 * Critério de sugestão comercial, não triagem clínica. Em empate, ou quando
 * nenhuma tag bate, prevalece a ordem do catálogo (o Essencial vem primeiro).
 */
function pickPack(queixa = "") {
  const q = queixa.toLowerCase();
  let best = PACKS[0];
  let bestScore = -1;
  for (const pack of PACKS) {
    const score = pack.tags.reduce((acc, tag) => acc + (q.includes(tag) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = pack;
    }
  }
  return best;
}

module.exports = { PACKS, pickPack };
