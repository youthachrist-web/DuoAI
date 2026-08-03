# DuoAI

Assistente operacional exclusivo da **LabDuo** (Medicina Diagnóstica). Sucessor do antigo "Jarvis/Orion" no ecossistema — mesmo motor, nova marca, nova missão, stack 100% open-source.

## Duas frentes

- **B2C — Base Worklab**: lê exportações do Worklab, cruza histórico de exames com sintomas atuais e escreve mensagens humanizadas de WhatsApp voltadas a prevenção e aos packs LabDuo. Regra de ouro: nunca citar "colesterol" diretamente; falar de energia, cansaço e risco metabólico. LGPD sempre.
- **B2B — Prospecção**: mapeia clínicas, medicina ocupacional, fisioterapia e academias via Google Maps e conduz para reunião comercial com o link do WhatsApp da LabDuo.

Ver [`docs/MISSION.md`](docs/MISSION.md) para o prompt operacional completo e [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para a stack open-source (OmniRoute + Hermes-Agent) que substitui o Twilio e demais fornecedores pagos.

## Webapp

Demo operacional das duas frentes em [`webapp/index.html`](webapp/index.html) (também publicado como artifact). Paleta e logotipo seguem a identidade LabDuo (teal `#128F87` + grafite `#495057`).

## Referências open-source

- Gateway de LLM: [OmniRoute](https://github.com/diegosouzapw/OmniRoute)
- Framework de agentes: [Hermes-Agent (NousResearch)](https://github.com/NousResearch/hermes-agent)
