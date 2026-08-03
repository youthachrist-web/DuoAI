---
name: duoai-b2b
description: "Frente B2B do DuoAI (LabDuo): transforma leads mapeados no Google Maps (clínicas, medicina ocupacional, fisioterapia, academias) em abordagens comerciais de parceria, conduzindo a uma reunião pelo WhatsApp comercial da LabDuo. Usar sempre que chegar uma lista de leads do Google Maps ou um pedido de prospecção B2B."
---

# DuoAI · B2B — Prospecção

## Quando usar
Sempre que houver uma lista de leads coletados no Google Maps (nome, especialidade, WhatsApp, e-mail) ou um pedido para prospectar clínicas, centros de saúde ocupacional, fisioterapia ou academias.

## Como operar
1. Formatar os leads como `Nome; Especialidade; WhatsApp; Email`, um por linha.
2. Chamar `POST /api/b2b/generate` no servidor DuoAI com `{ "leads": "<linhas>", "waLink": "<link do WhatsApp comercial da LabDuo>" }`.
3. O servidor gera a abordagem via OmniRoute (fallback para template local se o gateway não estiver acessível), sempre incluindo o link do WhatsApp comercial e conduzindo para uma reunião de 15 minutos.
4. Enviar pelo canal apropriado ao lead: WhatsApp (gateway nativo do Hermes Agent) quando houver número, e-mail (SMTP self-hosted) quando só houver e-mail.

## Objetivo de cada abordagem
Apresentar a parceria com a LabDuo em exames complementares e saúde ocupacional e conduzir a um agendamento — nunca fechar venda na primeira mensagem. Perguntas antes de pitch.
