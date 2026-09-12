# A letra Ragick

O painel está preparado para a **Ragick**, a letra que o Frederico escolheu.
Ela é paga, por isso o ficheiro não pode estar aqui no repositório antes de a
licença existir.

## Como a pôr a funcionar

Põe o ficheiro nesta pasta com **este nome exacto**:

```
public/tipos/ragick.woff2
```

E pronto. Não é preciso mexer em código nenhum: o painel já a procura aqui, e
assim que ela existir passa a ser a letra dos títulos, dos números e do
logótipo.

Enquanto não existir, o servidor responde 404 a esse pedido e o painel usa a de
reserva. Esse 404 aparece uma vez na consola do browser a cada carregamento —
é esperado, não é avaria, e desaparece no dia em que o ficheiro lá estiver.

Tem mesmo de ser `.woff2`. Não é teimosia: é entre três e cinco vezes mais
pequeno que o `.otf` ou o `.ttf` que vêm na compra, e no telemóvel isso é a
diferença entre o título aparecer logo ou aparecer meio segundo depois. Para
converter, o `fonttools` faz isso numa linha:

```sh
pip install fonttools brotli
fonttools ttLib.woff2 compress -o ragick.woff2 Ragick.otf
```

## Enquanto ela não chega

A de reserva é a **Rubik** (`rubik.woff2`, aqui ao lado). É a mais perto que há
sem custo: a mesma construção geométrica e pesada, os mesmos cantos levemente
arredondados, o mesmo `g` de um andar com o gancho e o mesmo `a` de dois
andares. Não é igual — a Ragick é mais larga e tem as terminações mais direitas
— mas é do mesmo feitio, e nada no painel fica torto por causa disso.

Está guardada aqui e não vem do Google: são 35 kB num único ficheiro variável
que cobre todos os pesos, e assim o painel não fica à espera de um sítio de fora
para desenhar os títulos. A licença dela é a SIL Open Font License e está em
`OFL-Rubik.txt`, que é o que essa licença pede que acompanhe o ficheiro.

## Os ícones da aplicação

Os ícones do ecrã principal (`icone-180.png`, `icone-192.png`, `icone-512.png` e
`icone-recortavel-512.png`) têm a palavra "fourLife" desenhada com a letra do
painel. Quando a Ragick entrar, é preciso voltar a gerá-los para o ícone
combinar com o cabeçalho — senão o telemóvel mostra uma letra e o painel mostra
outra.
