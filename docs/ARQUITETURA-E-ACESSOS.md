# Como o DuoAI está montado, e por onde se entra

Escrito a 11 de setembro de 2026, depois de duas perdas de base e de uma
reconstrução do painel. Serve para não haver outra vez um sistema que corre e
que ninguém sabe explicar.

## As peças

Tudo vive no projeto `DuoAI OS` do Railway, ambiente `production`.

| Serviço | O que faz | Fonte |
| --- | --- | --- |
| `Postgres` | a base. Leads, comunicações, relatórios, **e a sessão do WhatsApp** | imagem `postgres:16` |
| `api-server` | a API e os agentes automáticos | **perdida** — corre de uma imagem construída, sem repositório |
| `evolution` | Evolution API v2.3.7, a ponte para o WhatsApp | imagem |
| `painel-novo` | o painel e a porta de entrada | `youthachrist-web/DuoAI`, pasta `painel/` |
| `jarvis-web` | o painel antigo | **perdida** — a desligar |
| `hermes` | agente, com disco próprio | imagem |

## O disco

`postgres-data`, 5 GB, montado em `/var/lib/postgresql/data`.

Esteve por aplicar entre 21 de agosto e 11 de setembro, e é por isso que a base
se perdeu duas vezes. Ver `DISCO-PERMANENTE-E-PERDAS.md`.

**O Evolution guarda a sessão do WhatsApp dentro deste Postgres**
(`DATABASE_ENABLED=true`). Perder o disco é perder a ligação do telemóvel junto
com os leads — foram sempre o mesmo acidente, nunca dois.

## A porta

O `api-server` **não pede autenticação nenhuma** e o código dele perdeu-se, por
isso não há onde a acrescentar. A porta está no `painel-novo`:

```
internet  →  painel-novo  →  (rede privada)  →  api-server
                  ↑
            senha ou chave
```

O `api-server` não tem endereço público. `api-server.railway.internal:8080` só
é alcançável de dentro do projeto.

| Quem | Como entra |
| --- | --- |
| o Frederico, no telemóvel | senha em `PAINEL_SENHA`; fica um bilhete assinado num cookie `HttpOnly`, 30 dias |
| os scripts | cabeçalho `x-chave` com o valor de `PAINEL_CHAVE` |
| o Railway, para ver se o serviço arrancou | `/saude`, sempre aberto |

As senhas **não estão neste repositório** e nunca devem estar. Vivem nas
variáveis do serviço `painel-novo` no Railway, e no gestor de senhas do
Frederico.

## Os ritmos automáticos

Variáveis do `api-server`. Números, não segredos.

| Variável | Valor | O que faz |
| --- | --- | --- |
| `WHATSAPP_DAILY_CAP` | 25 | mensagens por dia, no máximo |
| `LINKEDIN_COMPANIES_PER_DAY` | 150 | empresas por dia no Apify |
| `LINKEDIN_PER_SWEEP` | 10 | empresas por varredura |
| `LINKEDIN_SWEEP_EVERY_MS` | 300000 | de cinco em cinco minutos |
| `ENRICH_DECISORES_PER_TICK` | 8 | decisores enriquecidos por ciclo |
| `PROSPECT_LEADS_PER_DAY` | 200 | leads novos do mapa por dia |

## O que continua partido

**A varredura do LinkedIn percorre os setores por ordem fixa** e encrava nos
mais pequenos — passou um dia inteiro em Estaleiros Navais, cidade a cidade, sem
encontrar ninguém, enquanto Metalurgia e Construção Civil, onde estão as
centenas de empresas, ficaram por tocar. Corrige-se no `api-server`, que não
tem fonte.

**O número da FourLife é reprovado pelo validador de celulares brasileiro** —
tem 8 dígitos depois do DDD em vez de 9. Por isso as mensagens levam o link do
perfil de WhatsApp Business e nunca um `wa.me` construído a partir dos dígitos.

**A chave da NinjaPear (ex-Proxycurl) é recusada com 401.** O Apify assume
sozinho, o que já está previsto no código; a chave só precisa de ser reemitida
se se quiser aquela fonte de volta.

**`POST /api/leads` não verifica repetidos**, ao contrário da importação do
mapa, que reconhece pelo nome. Quem repuser uma cópia por cima de uma base que
já tem leads cria duplicados — aconteceu, foram 38, e
`scripts/desduplicar.py` limpa-os ficando sempre a cópia mais rica.
