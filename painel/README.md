# Painel do DuoAI

Reconstruído em setembro de 2026. O painel anterior corria no Railway mas o seu
código-fonte não existia em repositório nenhum — tinha sido enviado por
`railway up` a partir de uma pasta que se perdeu. Os serviços corriam e não se
conseguiam alterar. Este existe para que isso não volte a acontecer.

Fala com a API que já estava publicada e continua a correr; não houve alteração
nenhuma do lado do servidor.

## Correr localmente

```bash
npm install
npm run dev      # fala com a API publicada, não precisa de base local
```

Para apontar a outra API:

```bash
API_PROXY_TARGET=http://localhost:8787 npm run dev
```

## Em produção

`server.mjs` serve a pasta `dist` e encaminha `/api` para `API_PROXY_TARGET`.
Sem dependências: é um processo que tem de arrancar sempre.

| Variável | Para quê |
| --- | --- |
| `PORT` | porta de escuta (8080 por omissão) |
| `API_PROXY_TARGET` | URL do `api-server`, sem barra no fim |

## Páginas

| Página | O que faz |
| --- | --- |
| Painel | contagens, como se chega aos leads, estado de cada peça do sistema |
| Diário | ligar o WhatsApp pelo QR e disparar a fila do dia, um lead de cada vez |
| Leads | a base toda, com procura e filtros por cidade e setor |
| Prospeção | lançar buscas novas no mapa e ver o que o LinkedIn deu |
| Relatórios | os relatórios diários gerados pelo servidor |

## Decisões que vale a pena conhecer

**O botão de disparo abre a janela antes de esperar pela resposta.** Se abrisse
depois, o browser tratava-a como popup e bloqueava-a. E só diz "enviada" quando
o servidor confirma `sent: true` — um HTTP 200 não é prova de envio.

**O QR recarrega de 15 em 15 segundos, não mais depressa.** Pedir ligação ao
Evolution com mais frequência derruba a sessão com `conflict: replaced`.

**Os relatórios são mostrados como texto, não interpretados como markdown.**
Vêm da base de dados; interpretá-los abriria a porta a HTML injectado.

**Não há percentagens nem variações inventadas.** Um número só aparece se vier
do servidor.

## O que este painel não resolve

A API não pede autenticação nenhuma. Quem souber o endereço lê os leads todos,
com telefones e emails. Isto já era assim antes desta reescrita e não se
conserta aqui — tem de ser resolvido no `api-server`, cujo código também se
perdeu. É o problema mais sério que continua em aberto, e é matéria de LGPD.
