---
name: duoai-b2c
description: "Frente B2C do DuoAI (LabDuo): processa a base exportada do Worklab e gera disparos humanizados de WhatsApp focados em prevenção e nos packs LabDuo. Usar sempre que chegar um upload/CSV do Worklab ou um pedido para reengajar leads da base."
---

# DuoAI · B2C — Base Worklab

## Quando usar
Sempre que houver uma planilha/CSV exportada do Worklab (colunas: `nome`, `whatsapp`, `ultimo_exame`, `queixa`) ou um pedido para gerar mensagens de reengajamento para a base de pacientes.

## Como operar
1. Chamar `POST /api/b2c/generate` no servidor DuoAI (`server/`, roda em `http://localhost:8787` por padrão) com `{ "csv": "<conteúdo do CSV>" }`.
2. O servidor cruza a queixa/histórico de cada lead com o catálogo de packs (`server/src/packs.js`) e escreve a mensagem via OmniRoute — com fallback automático para um template local se o OmniRoute não estiver acessível.
3. Cada mensagem já vem com o campo `compliance` preenchido. **Nunca envie uma mensagem com `compliance.ok === false` sem aplicar `compliance.suggestion` antes** — é a checagem que bloqueia a palavra "colesterol".
4. Enviar o texto final pelo gateway de WhatsApp nativo do Hermes Agent (ver `docs/ARCHITECTURE.md`) — não usar Twilio.

## Regra de ouro (não negociável)
Nunca usar a palavra "colesterol" diretamente numa abordagem B2C. Falar de energia, cansaço, histórico e risco metabólico. Sigilo absoluto dos dados sensíveis, sempre em conformidade com a LGPD — não persistir dados de saúde além do necessário para operar o envio.

## Revisão humana
Antes do primeiro disparo de cada campanha nova, um humano revisa uma amostra das mensagens geradas (regra do "último olho", herdada do Método Orion). IA acelera o volume; a decisão de tom e fato é sempre humana.
