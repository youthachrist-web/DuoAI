# Domínio, DNS, disparos e landing page

Este documento responde a uma pergunta concreta: o que escrever no diálogo
**"Outra plataforma de hospedagem — Servidor 1 / Servidor 2"** da HostGator, como
ficam os **disparos de email** e **onde vive a landing page**.

Tudo aqui foi verificado por consulta real de DNS e pela API da Resend. Onde não
sei o valor, está escrito `SEU-DOMINIO` — não há nenhum registo inventado.

---

## 1. Resposta curta: não preencha esse diálogo

Aqueles dois campos mudam os **nameservers** do domínio, ou seja, mudam *quem
manda* no DNS inteiro. O aviso da própria HostGator diz o essencial:

> Caso a configuração seja feita para um servidor fora da HostGator, os registros
> na Zona de DNS, apontamentos de e-mail e outras configurações deverão ser
> feitas no outro provedor.

Traduzindo: se delegar, **todo** o DNS sai da HostGator de uma vez — incluindo o
MX do email de trabalho (`@SEU-DOMINIO`), que deixa de existir até ser recriado
no outro lado. É a causa clássica de "o email da empresa parou".

Nada do que o DuoAI precisa exige mudar nameserver. Precisa de **registos dentro
da zona de DNS**, e isso faz-se na HostGator: **cPanel → Zona de DNS / Editor de
Zona**.

**Recomendação: feche esse diálogo e mantenha os nameservers da HostGator.**

### Quando delegar faz sentido (rota B)

Só há uma razão boa: querer a landing page no **domínio raiz** (`SEU-DOMINIO`
sem `www`) alojada fora da HostGator. O DNS não permite `CNAME` na raiz, e o
editor da HostGator não tem *CNAME flattening*. Nesse caso vale delegar para a
Cloudflare (que achata o CNAME na raiz) — e então **recriar lá todos os
registos**, MX de email incluído, antes de trocar os nameservers.

---

## 2. Os registos dos disparos (Resend)

O envio é feito pela Resend. Ela assina o email com o **seu** domínio, e é isso
que tira as mensagens do "modo sandbox" (hoje o remetente é
`onboarding@resend.dev`, que só entrega ao dono da conta).

O passo é: **Resend → Domains → Add Domain → `envios.SEU-DOMINIO`**. A Resend
mostra os registos exatos; copie-os para a zona de DNS da HostGator.

Formato dos registos (confirmado no domínio já verificado desta conta):

| Nome | Tipo | Valor | Para quê |
| --- | --- | --- | --- |
| `send.envios` | MX (prioridade 10) | `feedback-smtp.<REGIÃO>.amazonses.com` | Return-Path: bounces e reclamações |
| `send.envios` | TXT | `v=spf1 include:amazonses.com ~all` | SPF — autoriza a Resend a enviar |
| `resend._domainkey.envios` | TXT | `p=MIGfMA0GCSq...` (a Resend gera) | DKIM — a assinatura da mensagem |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:drasabrinalucietti@gmail.com` | DMARC — política e relatórios |

Notas que evitam retrabalho:

- **`<REGIÃO>`** é a que a Resend indicar ao criar o domínio. Para um domínio
  brasileiro escolha **São Paulo** se estiver disponível; o domínio existente
  desta conta está em `eu-west-1`. Não invente a região: use o que aparece no
  painel.
- **Use um subdomínio de envio** (`envios.` ou `mail.`). Dois motivos: não toca
  no MX do domínio principal, portanto o email da empresa não corre risco; e a
  reputação dos disparos frios fica separada da reputação do email humano.
- **DMARC começa em `p=none`.** É modo observação: recebe relatórios sem
  arriscar entregas. Só depois de semanas limpas se sobe para `p=quarantine` e,
  mais tarde, `p=reject`.
- **O DKIM é uma linha só, longa.** O editor da HostGator às vezes corta ao
  colar: confirme depois de gravar que o valor terminou igual ao da Resend.

### Sobre a fotografia do remetente no Gmail

O nome já aparece como **LabDuo - Medicina Diagnóstica** e a fotografia está no
corpo do email. O ícone redondo ao lado do remetente na caixa de entrada é outra
coisa: chama-se **BIMI**, e exige DMARC em imposição (`p=quarantine` ou
`p=reject`) mais um *Verified Mark Certificate* — um certificado pago, ligado a
uma marca registada. Não sai de código nenhum, nem de um domínio de envio
partilhado. Fica para depois do DMARC estar imposto.

---

## 3. Onde fica a landing page

Ainda **não existe** landing page no repositório — o que está publicado é o
webapp do DuoAI. Vale dizer isto sem rodeios para não haver a expectativa de que
basta apontar o DNS.

Escolhido o alojamento, o apontamento é este:

| Nome | Tipo | Valor | O quê |
| --- | --- | --- | --- |
| `www` | CNAME | host da landing page | Landing page |
| `@` (raiz) | A / redirecionamento | IP do host, ou redirect para `www` | Raiz do domínio |
| `app` | CNAME | `jarvis-web-production-d473.up.railway.app` | Webapp DuoAI |
| `api` | CNAME | `api-server-production-20c2.up.railway.app` | API do DuoAI |

Três opções para a landing, da mais simples à mais flexível:

1. **Na própria HostGator** (`public_html`). A hospedagem já está paga, a raiz do
   domínio funciona sem truques e não se mexe em nameserver nenhum. É a rota mais
   curta para uma página estática.
2. **No Railway, ao lado do webapp.** Um serviço estático a mais, domínio
   personalizado adicionado no serviço, `CNAME` de `www` para o alvo que o
   Railway indicar. Fica tudo num só painel.
3. **Na Vercel ou Cloudflare Pages.** É onde vive o site do outro domínio desta
   conta. Bom para uma página de marketing com deploy por commit.

Nas três, os subdomínios `app` e `api` continuam a ser `CNAME` na zona da
HostGator — nenhum deles precisa da raiz do domínio.

Depois de adicionar o domínio personalizado no serviço `jarvis-web` do Railway,
falta um passo do lado do Clerk: autorizar esse domínio na instância de
autenticação, e usar uma chave `pk_live_`. A chave de desenvolvimento
(`pk_test_`) recusa origens que não sejam as dela — é a razão do cartão de
diagnóstico no ecrã de login.

---

## 4. O que configurar no DuoAI depois

Nada disto está em código: são variáveis de ambiente do serviço `api-server`.

| Variável | Valor | Efeito |
| --- | --- | --- |
| `MAIL_FROM` | `LabDuo - Medicina Diagnóstica <contato@envios.SEU-DOMINIO>` | Tira os disparos do sandbox; passa a entregar a qualquer destinatário |
| `BRAND_SITE` | `https://SEU-DOMINIO` | Põe o site na assinatura dos emails e do WhatsApp |
| `BRAND_LOGO_URL` | opcional | Por omissão usa `/labduo-logo.jpg` servido pelo próprio painel |

`MAIL_REPLY_TO` e `OWNER_EMAILS` já estão definidos com
`drasabrinalucietti@gmail.com` e `youthachrist@gmail.com`: as respostas dos leads
e os relatórios diário, semanal e mensal vão para os dois.

`BRAND_SITE` fica **vazio** até haver domínio confirmado, de propósito. Ver a
secção seguinte.

---

## 5. Estado verificado hoje

- **`labduo.com.br` não é da LabDuo.** Os nameservers são da Com Laude (registrar
  de proteção de marca), não tem MX, o SPF é `v=spf1 -all` (domínio que não envia
  email) e o endereço aponta para uma página estacionada da AstraZeneca. Não pode
  entrar em assinatura, email ou landing page.
- **`oriondigital.pt` está verificado na Resend** e com os registos de envio
  completos (`send.` com MX e SPF, DKIM em `resend._domainkey`). É o único
  domínio de envio funcional desta conta neste momento.
- **`_dmarc.oriondigital.pt` não existe.** Falta o registo; adicioná-lo é o passo
  mais barato para melhorar a entrega desse domínio, com `p=none` para começar.

Enquanto não houver domínio da LabDuo verificado, há duas saídas — e ambas são
decisão de quem manda na marca, não minha:

1. **Verificar um subdomínio de um domínio da LabDuo** (rota certa a prazo).
2. **Enviar por `oriondigital.pt` já verificado**, mantendo o nome visível
   "LabDuo - Medicina Diagnóstica" na caixa de entrada. Funciona hoje, com uma
   consequência honesta: quem inspecionar o endereço vê `oriondigital.pt` e não a
   LabDuo. É uma variável de ambiente, reversível a qualquer momento.
