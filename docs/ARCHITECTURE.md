# Arquitetura DuoAI — stack open-source, sem Twilio

Objetivo: manter todas as funcionalidades do sistema anterior (Jarvis) trocando fornecedores pagos por alternativas open-source, sem exigir cartão de crédito ou cota mensal de terceiros para operar o dia a dia. Nada aqui depende do Agent pago do Replit — o backend roda como código próprio neste repositório.

## Trocas de fornecedor

| Função | Antes (pago) | Depois (open-source) | Observação |
|---|---|---|---|
| Gateway de LLM | Chamadas diretas a APIs proprietárias | **OmniRoute** — https://github.com/diegosouzapw/OmniRoute | Proxy local OpenAI-compatible (`POST /v1/chat/completions`), roda com `npm install -g omniroute && omniroute` em `http://localhost:20128`. `server/src/omniroute-client.js` já fala com ele. |
| Orquestração de agentes + WhatsApp | Twilio + lógica monolítica | **Hermes Agent** (NousResearch) — https://github.com/NousResearch/hermes-agent | Runtime de agente com **gateway de mensageria nativo (WhatsApp, Telegram, Discord, Slack, Signal)** — não é preciso Twilio nem um gateway WhatsApp separado. Skills próprias do DuoAI ficam em `agent/hermes/skills/duoai-b2c` e `duoai-b2b`, copiadas para `~/.hermes/skills/` pelo `scripts/setup.sh`. |
| E-mail comercial B2B | Resend/SendGrid | SMTP self-hosted (Postal / Mailu) | Cobre contato por e-mail com clínicas quando o WhatsApp não é o canal disponível. |

## O que já está implementado e testado neste repositório

- `server/` — serviço Node (sem dependências externas) com a lógica real das duas frentes:
  - `src/packs.js` — catálogo dos 9 packs LabDuo e o motor de recomendação por sintoma/queixa.
  - `src/compliance.js` — filtro que bloqueia "colesterol" e sugere a reescrita compliant.
  - `src/b2c.js` / `src/b2b.js` — geram a mensagem via OmniRoute e caem para um template local se o gateway estiver fora do ar (o fluxo nunca trava por falta de LLM).
  - `src/worklab-csv.js` — parser do CSV exportado do Worklab.
  - `src/index.js` — expõe `POST /api/b2c/generate` e `POST /api/b2b/generate`, e serve `webapp/` estático.
  - `test/` — `node --test test/*.test.js`, 7 testes cobrindo compliance, recomendação de pack e parsing do CSV.
- `agent/hermes/skills/` — as duas skills do Hermes Agent que descrevem quando e como cada frente deve ser operada.
- `.env.example` e `scripts/setup.sh` — como subir OmniRoute + Hermes Agent + servidor DuoAI localmente, em qualquer VPS ou container próprio (sem Replit).

## Fluxo

```
Upload Worklab (CSV) ──▶ POST /api/b2c/generate ──┐
                                                    ├─▶ OmniRoute (LLM) ──▶ checagem de compliance ──▶ Hermes Agent → WhatsApp
Leads Google Maps ─────▶ POST /api/b2b/generate ──┘
```

## Compliance embutido (não é opcional)

- Filtro de termos bloqueados antes de qualquer envio B2C (ex.: "colesterol"); toda resposta da API já vem com `compliance.ok` e `compliance.suggestion`.
- Nenhum dado sensível de saúde é logado fora do necessário para operação; retenção mínima, conforme LGPD.
- Toda mensagem de disparo em escala passa por revisão humana antes do primeiro envio de cada campanha nova (regra do "último olho", herdada do Método Orion).

## Onde cada peça roda

- **Servidor DuoAI (B2C/B2B) + OmniRoute + Hermes Agent**: rodam como processos próprios (`scripts/setup.sh`), em qualquer máquina/VPS/container que a LabDuo controle — não dependem do Agent pago do Replit nem de Twilio.
- **Frontend operacional**: `webapp/index.html` (também publicado como artifact), servido pelo próprio servidor DuoAI em `/`.
