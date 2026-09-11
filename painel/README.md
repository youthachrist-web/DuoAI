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
| `API_PROXY_TARGET` | endereço do `api-server`, sem barra no fim. Em produção é o da rede privada: `http://api-server.railway.internal:8080` |
| `PAINEL_SENHA` | senha de entrada. Sem ela o painel fica aberto — só para desenvolvimento |
| `PAINEL_CHAVE` | chave para scripts, enviada no cabeçalho `x-chave` |

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

## A porta está aqui, e não na API

O `api-server` não pede autenticação nenhuma, e o código dele perdeu-se — não se
consegue alterar. Enquanto teve endereço público, qualquer pessoa que soubesse o
URL lia os leads todos, com nomes, telefones e emails.

Por isso a porta fecha-se aqui. Este processo é a única entrada: fala com a API
pela rede privada do Railway, que não é alcançável de fora, e exige senha.

Duas formas de entrar, ambas verificadas em tempo constante:

- **pessoas** — a senha põe um bilhete assinado num cookie `HttpOnly`, válido 30
  dias. `/sair` apaga-o.
- **scripts** — o cabeçalho `x-chave` com o valor de `PAINEL_CHAVE`. É o que a
  cópia diária e o remapeamento usam depois de a API deixar de ser pública.

`/saude` fica sempre aberto: é por aí que o Railway confirma que o serviço
arrancou, e fechá-lo impediria o serviço de ficar de pé.

Um bilhete forjado, uma chave errada e uma senha errada devolvem todos 401 —
está testado.
