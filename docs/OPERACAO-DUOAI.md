# Operar o DuoAI

O que existe, o que está ligado, e o que ainda depende de configuração externa.
Tudo aqui foi medido em produção, não estimado.

## 1. Nada contacta ninguém sem a tua ordem

O botão está no **Painel Diário**, em cima: **Iniciar contactos**. Está **desligado
por omissão** e o estado fica no servidor, não no browser — suspender no telemóvel
para o lote que corre no contentor.

Enquanto está desligado não sai nada: nem o lote horário, nem um follow-up já
agendado.

Ao lado, dois botões de limpeza:

- **Zerar contactados** — apaga `lastContactedAt`, o registo de comunicações e os
  follow-ups em fila, e recua a etapa **só** onde ela diz literalmente
  "contactado". Um lead que já chegou a proposta mantém o progresso.
  **Opt-outs nunca são apagados**, em nenhuma limpeza.
- **Limpar relatórios** — remove os relatórios guardados.

Já corridos hoje: 41 leads desmarcados, 82 comunicações e 5 relatórios removidos.

## 2. WhatsApp dos leads: 7 → 60

O exportador mostrava 445 empresas, 213 com telefone e **7 com WhatsApp**. Não era
falta de dados, eram dois erros:

1. O importador **nunca escrevia** a coluna `whatsapp`, e chamava só a metade
   "email" de um crawler que também procura o botão wa.me. O código que encontra
   WhatsApp já existia e ninguém o chamava.
2. Um celular brasileiro válido em `phone` não era reconhecido como WhatsApp. Aqui
   o celular **é** o WhatsApp.

Agora, por ordem de força da prova:

| Prova | Como se obtém |
| --- | --- |
| Botão wa.me no site da empresa | Crawler da homepage + páginas de contacto |
| Tag `contact:whatsapp` / `whatsapp` do OSM | Nunca era lida; mappers brasileiros usam-na |
| Telefone que o validador diz ser celular | Reclassificação — os dígitos são os da empresa, só mudou a classificação |

Resultado do backfill: **60 leads com WhatsApp**, 162 só com fixo, 223 sem
telefone. Endpoints: `POST /api/control/enrich-whatsapp` (`{"batch":50}`,
repetir enquanto `faltamMais` for `true`; `{"recheck":true}` varre tudo de novo)
e `GET /api/control/whatsapp-coverage`.

## 3. Disparo por API no WhatsApp (Evolution)

O código está integrado: `POST /api/leads/:id/whatsapp-send` envia de verdade e
marca a comunicação como `sent` com o id da mensagem. `GET /api/whatsapp/status`
diz se é possível agora.

**Falta o servidor.** A Evolution API é auto-hospedada e precisa de:

1. Deploy do serviço (PostgreSQL + Redis) — passos em
   `docs/integrations/evolution-api.md`;
2. `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` e (opcional) `EVOLUTION_INSTANCE` no
   `api-server`;
3. **Ler o QR code** com o telemóvel da LabDuo — este passo é presencial e ninguém
   o pode fazer pelo operador.

Sem isso, o disparo continua a gerar o link wa.me que o operador toca, e o
assistente diz exactamente isso em vez de inventar uma limitação.

## 4. De onde vêm os leads

Na aba **Atividade**, por lead: se veio da **base de mapeamento (OpenStreetMap)**
ou do **LinkedIn**, com a busca que o encontrou. Nos do LinkedIn aparecem também os
**responsáveis** — nome, cargo, perfil — guardados em `lead_contacts` (só
identidade profissional, nada pessoal).

A base de mapeamento não traz pessoas, e a linha diz isso em vez de deixar um
espaço vazio. Para nomear o decisor usa-se a análise SDR:
`GET /api/sdr?setor=&cidade=&limite=3&importar=1` — com `importar=1` as empresas
entram como leads com origem LinkedIn e os responsáveis ficam guardados.

## 5. "Mostrar já contactados" não estava avariado

O toggle funcionava. Os leads que devia revelar eram filtrados **uma linha antes**:
a fila só aceitava `source === "openstreetmap"`, de quando o mapeamento era o único
fornecedor. Importações do LinkedIn chegam como `apify` e as linhas mais antigas não
têm origem — todas desapareciam antes de o ecrã ser desenhado. A fila passa a
aceitar quem não tenha feito opt-out, e o número aparece ao lado do botão.

## 6. O que continua vermelho, e porquê

| Item | Estado | O que falta |
| --- | --- | --- |
| Evolution API | não configurada | deploy + QR code (ponto 3) |
| Número da LabDuo | reprovado na validação | `+55 47 9106-6457` tem 8 dígitos depois do DDD; um celular brasileiro tem 9. O link do perfil (`wa.me/message/G7F4TRTQC5SEA1`) funciona de qualquer forma — é por isso que é ele que vai nas mensagens, e nunca um `wa.me/<dígitos>` reconstruído |
| LinkedIn (NinjaPear) | chave recusada 401 | A Proxycurl foi descontinuada; reemitir a chave no painel da NinjaPear. O Apify assume automaticamente |
| Domínio de envio | a usar `oriondigital.pt` | verificar um subdomínio da LabDuo na Resend; o servidor troca sozinho |

O estado ao vivo está sempre em `GET /api/status`.
