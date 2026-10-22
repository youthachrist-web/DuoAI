#!/usr/bin/env python3
"""
Disparo do aviso de "fora do ar" aos donos, um email personalizado para cada um.

Sai pela Resend, com o mesmo remetente dos disparos do DuoAI. A chave fica
fora do repositório, em RESEND_API_KEY.

    python3 aviso-fora-do-ar.py              # só gera as pré-visualizações .html
    RESEND_API_KEY="re_..." python3 aviso-fora-do-ar.py --enviar

As pré-visualizações ficam na pasta actual, uma por pessoa, para ver antes de
enviar.
"""

import html
import json
import os
import sys
import urllib.request

REMETENTE = os.environ.get("MAIL_FROM", "LabDuo - Medicina Diagnóstica <labduo@oriondigital.pt>")
ASSUNTO = "{nome}, o DuoAI · FourLife está fora do ar"

DONOS = [
    {
        "nome": "Fred",
        "email": "youthachrist@gmail.com",
        "paragrafos": [
            "O servidor caiu e pus o DuoAI · FourLife fora do ar. Se abrires o painel no "
            "telemóvel, vais ver a página de \"Sistema fora do ar\" em vez da senha. "
            "É o esperado, não é o teu telemóvel.",
            "Os scripts que entram com a chave (a cópia diária dos leads incluída) também "
            "ficam parados enquanto isto durar. Se a cópia de hoje falhar, é por isso.",
            "Para voltar a abrir: no Railway, serviço painel-novo, define FORA_DO_AR=0 e "
            "reinicia. Não é preciso mexer no código.",
        ],
    },
    {
        "nome": "Sabrina",
        "email": "drasabrinalucietti@gmail.com",
        "paragrafos": [
            "Fica registado: o servidor caiu e o DuoAI · FourLife está fora do ar. "
            "Ninguém entra no painel nem vê os contactos dos leads, nem com senha.",
            "Os leads e as conversas continuam guardados na base. Nada foi apagado ao pôr "
            "o sistema off-line.",
            "Enquanto estiver fora do ar, não abras os links do painel aos leads nem "
            "à equipa: vão ver só a página de aviso. Quando voltar, avisamos.",
        ],
    },
]

MODELO = """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#F3F6F6;font-family:Arial,Helvetica,sans-serif;color:#14181F">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E3E6EB;border-radius:12px">
    <tr><td style="padding:20px 24px;border-bottom:3px solid #128F87">
      <span style="font-size:16px;font-weight:bold;color:#128F87">LabDuo</span>
      <span style="font-size:13px;color:#495057"> · DuoAI · FourLife</span>
    </td></tr>
    <tr><td style="padding:24px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;color:#B42318">Sistema fora do ar</p>
      <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3">Olá, {nome}</h1>
      {corpo}
      <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#495057">Qualquer dúvida, responde a este email.</p>
    </td></tr>
    <tr><td style="padding:14px 24px;border-top:1px solid #E3E6EB;font-size:12px;color:#667085">
      LabDuo - Medicina Diagnóstica · aviso interno, enviado só aos donos do sistema.
    </td></tr>
  </table>
</body></html>"""


def montar(dono):
    corpo = "\n      ".join(
        f'<p style="margin:0 0 12px;font-size:15px;line-height:1.6">{html.escape(p)}</p>'
        for p in dono["paragrafos"]
    )
    texto = f"Olá, {dono['nome']}\n\n" + "\n\n".join(dono["paragrafos"]) + "\n\nQualquer dúvida, responde a este email."
    return MODELO.format(nome=html.escape(dono["nome"]), corpo=corpo), texto


def enviar(chave, dono, corpo_html, texto):
    pedido = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps({
            "from": REMETENTE,
            "to": [dono["email"]],
            "subject": ASSUNTO.format(nome=dono["nome"]),
            "html": corpo_html,
            "text": texto,
        }).encode(),
        headers={"Authorization": f"Bearer {chave}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(pedido, timeout=30) as r:
        return json.load(r).get("id")


def main():
    disparar = "--enviar" in sys.argv
    chave = os.environ.get("RESEND_API_KEY", "")
    if disparar and not chave:
        sys.exit("Falta RESEND_API_KEY. Nada foi enviado.")

    for dono in DONOS:
        corpo_html, texto = montar(dono)
        previa = f"aviso-fora-do-ar-{dono['nome'].lower()}.html"
        with open(previa, "w", encoding="utf-8") as f:
            f.write(corpo_html)
        if disparar:
            print(f"{dono['nome']} <{dono['email']}>: enviado, id {enviar(chave, dono, corpo_html, texto)}")
        else:
            print(f"{dono['nome']} <{dono['email']}>: pré-visualização em {previa}")


if __name__ == "__main__":
    main()
