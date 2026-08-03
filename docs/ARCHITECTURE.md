# Arquitetura DuoAI — stack open-source

Objetivo: manter todas as funcionalidades do sistema anterior (Jarvis) trocando fornecedores pagos por alternativas open-source, sem exigir contrato ou cartão de crédito recorrente para operar o dia a dia.

## Trocas de fornecedor

| Função | Antes (pago) | Depois (open-source) | Observação |
|---|---|---|---|
| Envio/recebimento de WhatsApp | Twilio | **Evolution API** ou **Baileys** (whatsapp-web.js) | Gateway self-hosted, sem custo por mensagem; mesma função de disparo humanizado B2C e prospecção B2B. |
| Gateway de LLM | Chamadas diretas a APIs proprietárias | **OmniRoute** — https://github.com/diegosouzapw/OmniRoute | Camada única de roteamento de LLM; evita integração direta com cada provedor e reduz lock-in. |
| Orquestração de agentes | Lógica monolítica única | **Hermes-Agent** (NousResearch) — https://github.com/NousResearch/hermes-agent | Agentes especializados: um para a frente B2C (leitura de base + compliance + geração de mensagem), outro para a frente B2B (parsing de leads do Maps + abordagem comercial). |
| E-mail comercial B2B | Resend/SendGrid | SMTP self-hosted (Postal / Mailu) | Cobre contato por e-mail com clínicas quando o WhatsApp não é o canal disponível. |

## Fluxo

```
Upload Worklab (CSV) ──┐
                        ├──▶ Hermes-Agent (agente B2C) ──▶ OmniRoute ──▶ checagem compliance ──▶ Evolution API/Baileys (WhatsApp)
Leads Google Maps ─────┘
                        └──▶ Hermes-Agent (agente B2B) ──▶ OmniRoute ──▶ Evolution API/Baileys + SMTP self-hosted
```

## Compliance embutido (não é opcional)

- Filtro de termos bloqueados antes de qualquer envio B2C (ex.: "colesterol"); mensagem é reescrita para focar em energia/cansaço/prevenção.
- Nenhum dado sensível de saúde é logado fora do necessário para operação; retenção mínima, conforme LGPD.
- Toda mensagem de disparo em escala passa por revisão humana antes do primeiro envio de cada campanha (regra do "último olho", herdada do Método Orion).

## Onde cada peça roda

- **Backend/agentes (Hermes-Agent, OmniRoute, gateway WhatsApp)**: projeto Replit "Jarvis Claude Assistant" — recebe a atualização de código diretamente pelo agente do Replit.
- **Frontend operacional**: `webapp/index.html` neste repositório (mesmo conteúdo publicado como artifact), com upload de base B2C e formulário de prospecção B2B.
