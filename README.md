# DuoAI

Assistente operacional exclusivo da **LabDuo** (Medicina Diagnóstica). Sucessor do antigo "Jarvis/Orion" no ecossistema — mesmo motor, nova marca, nova missão, stack 100% open-source.

## Duas frentes

- **B2C — Base Worklab**: lê exportações do Worklab, cruza histórico de exames com sintomas atuais e escreve mensagens humanizadas de WhatsApp voltadas a prevenção e aos packs LabDuo. Regra de ouro: nunca citar "colesterol" diretamente; falar de energia, cansaço e risco metabólico. LGPD sempre.
- **B2B — Prospecção**: mapeia clínicas, medicina ocupacional, fisioterapia e academias via Google Maps e conduz para reunião comercial com o link do WhatsApp da LabDuo.

Ver [`docs/MISSION.md`](docs/MISSION.md) para o prompt operacional completo e [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para a stack open-source (OmniRoute + Hermes-Agent) que substitui o Twilio e demais fornecedores pagos.

## Rodando localmente (sem Twilio, sem custo de terceiros)

```bash
cp .env.example .env
bash scripts/setup.sh   # sobe OmniRoute + Hermes Agent + servidor DuoAI
```

Ou só o backend das duas frentes, sem o Hermes Agent, para testar a API/webapp:

```bash
cd server && npm install && npm start   # http://localhost:8787
```

```bash
cd server && npm test   # 7 testes: compliance, recomendação de pack, parsing do CSV
```

## Webapp

Demo operacional das duas frentes em [`webapp/index.html`](webapp/index.html) — servido pelo próprio backend em `/`, e também publicado como artifact. Paleta e logotipo seguem a identidade LabDuo (teal `#128F87` + grafite `#495057`).

## Estrutura

```
server/                 backend das frentes B2C/B2B (Node, sem dependências pagas)
  src/packs.js          catálogo dos 9 packs LabDuo + recomendação por sintoma
  src/compliance.js     bloqueio da palavra "colesterol" em B2C
  src/omniroute-client.js  cliente do gateway de LLM OmniRoute
  src/b2c.js, src/b2b.js   geração de mensagem por frente
  test/                 node --test
agent/hermes/skills/    skills do Hermes Agent (duoai-b2c, duoai-b2b)
webapp/index.html       painel operacional (LabDuo branding)
docs/MISSION.md         prompt de sistema e missão do DuoAI
docs/ARCHITECTURE.md    detalhe da stack open-source
scripts/setup.sh        sobe OmniRoute + Hermes Agent + servidor
```

## Referências open-source

- Gateway de LLM: [OmniRoute](https://github.com/diegosouzapw/OmniRoute)
- Runtime de agente + gateway de mensageria (WhatsApp nativo): [Hermes Agent (NousResearch)](https://github.com/NousResearch/hermes-agent)
