# A causa das duas perdas de base, e o que ficou corrigido

Registo do dia 11 de setembro de 2026. Fica escrito porque a mesma falha
apagou a base duas vezes e ninguém tinha nota de porquê.

## A causa

O serviço `Postgres` do projeto `DuoAI OS` corria **sem volume**. O volume
`postgres-data` existia no Railway desde 21 de agosto, mas ficou em
*staged changes* — criado e nunca aplicado. Três semanas assim.

Sem volume, o diretório de dados do Postgres vive no sistema de ficheiros do
contentor. O contentor é descartável: qualquer reinício ou redeploy do serviço
começa com um disco limpo.

O último redeploy do Postgres foi a **8 de setembro, 19:46**. É a mesma marca
temporal que aparece em dois sítios que pareciam problemas separados:

- a base caiu de 1662 para 202 leads;
- o WhatsApp deixou de ligar, com `Not Found` no lugar do QR code.

Nunca foram dois problemas. O Evolution API guarda a sessão do telemóvel
**dentro do mesmo Postgres** (`DATABASE_ENABLED=true`,
`DATABASE_SAVE_DATA_INSTANCE=true`). O disco que apagou os leads apagou a
ligação do WhatsApp no mesmo instante.

## O que ficou feito

1. Cópia dos 736 leads e das comunicações pela API, antes de tocar em nada.
2. Alterações pendentes aplicadas: volume `postgres-data` criado e montado em
   `/var/lib/postgresql/data`, 5 GB, estado READY.
3. O `api-server` corre `drizzle-kit push --force` no arranque, por isso
   recriou o esquema sozinho no primeiro deploy depois do reinício.
4. Os 736 leads foram repostos pela rota `POST /api/leads`. Zero falhas.
5. O Evolution foi reiniciado para recriar as tabelas dele e a instância
   `labduo` foi criada de novo.

## O que a reposição não devolve

A rota `POST /api/leads` aceita uma lista fechada de campos. Estes vieram na
cópia e **não** voltaram à base:

| Campo | Linhas afetadas | Consequência |
| --- | --- | --- |
| `googlePlaceId` | 736 | chave de origem do OpenStreetMap |
| `address` | 428 | morada da empresa |
| `source`, `sourceQuery` | 736 | de que consulta veio o lead |
| `analysisSummary`, `bottleneck`, `bottleneckKind`, `websiteWeaknesses` | 736 | texto de análise mostrado no painel |

Os campos de análise são regenerados pelo enriquecimento automático, que corre
de dez em dez minutos. Os outros não voltam sem novo mapeamento.

**Não houve duplicados.** Antes de repor, correu-se uma varredura do mapa sobre
um lead que já estava na base, para confirmar que a importação reconhece
repetidos pelo nome e não apenas pelo `googlePlaceId`. Reconhece: a corrida
encontrou 15 empresas e saltou a que já lá estava.

## O que continua por resolver

- **Não há cópia automática.** `scripts/backup-diario.py` faz a cópia, mas tem
  de ser agendado fora do Railway — no computador ou num agendador próprio.
  Uma cópia que depende de alguém se lembrar não é uma cópia.
- **O código-fonte dos serviços publicados não está em repositório nenhum.**
  `api-server` e `jarvis-web` foram enviados por `railway up` a partir de uma
  pasta local que já não existe. Nenhum dos repositórios da conta
  (`ecossistema-jarvis5`, `Ecossistema-Jarvis`, `Ecossistema-Jarvis-`,
  `JARVIS-`) contém a aplicação React nem o servidor TypeScript. Enquanto for
  assim, os serviços correm mas não se conseguem alterar nem reconstruir.

## Como verificar que o disco está mesmo montado

```
query { project(id: "<projectId>") { volumes { edges { node { name
  volumeInstances { edges { node { mountPath state } } } } } } } }
```

`postgres-data` tem de aparecer com `mountPath: /var/lib/postgresql/data` e
`state: READY`. Se aparecer sem `volumeInstances`, está outra vez por aplicar.
