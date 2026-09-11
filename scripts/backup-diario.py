#!/usr/bin/env python3
"""
Cópia diária dos leads e das comunicações, para fora do Railway.

Isto existe porque a base já se perdeu duas vezes. A primeira fui eu que a
destruí, ao reiniciar o Postgres sem verificar que não tinha volume. A segunda
perdeu-se num restauro, e a única cópia era um ficheiro num portátil que também
se perdeu.

Guarda dois ficheiros com a data no nome, e nunca sobrescreve o de outro dia:

    fourlife-leads-AAAA-MM-DD.csv     — para abrir e ler
    fourlife-leads-AAAA-MM-DD.json    — todos os campos, para restaurar
    fourlife-comunicacoes-AAAA-MM-DD.json

    python3 backup-diario.py                    # guarda na pasta actual
    python3 backup-diario.py ~/Drive/fourlife   # guarda onde quiseres

## Para correr sozinho todos os dias

macOS ou Linux — `crontab -e` e acrescenta (todos os dias às 23h):

    0 23 * * * /usr/bin/python3 /caminho/para/backup-diario.py /caminho/para/pasta

Windows — Agendador de Tarefas, tarefa diária, programa `python`, argumentos o
caminho do script e da pasta.

**Aponta a pasta para dentro do Drive, Dropbox ou OneDrive.** Uma cópia no mesmo
computador não é uma cópia: é o mesmo disco a poder falhar duas vezes.
"""

import csv
import datetime
import json
import os
import sys
import urllib.error
import urllib.request

BASE = "https://api-server-production-20c2.up.railway.app/api"

CAMPOS = [
    "id", "businessName", "city", "niche", "tier", "score",
    "phone", "whatsapp", "email", "website", "address",
    "stage", "source", "sourceQuery",
    "lastContactedAt", "ultimoWhatsApp", "optOutAt",
]


def buscar(caminho):
    with urllib.request.urlopen(f"{BASE}{caminho}", timeout=180) as r:
        return json.loads(r.read().decode("utf-8"))


def lista_de(dados, *chaves):
    if isinstance(dados, list):
        return dados
    for k in chaves:
        v = dados.get(k)
        if isinstance(v, list):
            return v
    return []


def main():
    pasta = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(pasta, exist_ok=True)
    hoje = datetime.date.today().isoformat()

    try:
        leads = lista_de(buscar("/leads?limit=5000"), "leads", "data")
        coms = lista_de(buscar("/communications?limit=20000"), "communications", "data")
    except urllib.error.URLError as e:
        print(f"não consegui falar com o painel: {e}")
        return 1

    """
    Uma base vazia nunca sobrescreve nada.

    Se o painel responder com zero leads é muito mais provável que algo esteja em
    baixo do que a operação ter desaparecido — e uma cópia de zero leads gravada por
    cima da de ontem é pior do que não haver cópia nenhuma.
    """
    if not leads:
        print("o painel devolveu zero leads — nada foi gravado.")
        print("verifica o api-server no Railway antes de te preocupares com a base.")
        return 1

    cam_json = os.path.join(pasta, f"fourlife-leads-{hoje}.json")
    with open(cam_json, "w", encoding="utf-8") as f:
        json.dump(leads, f, ensure_ascii=False, indent=1)

    cam_csv = os.path.join(pasta, f"fourlife-leads-{hoje}.csv")
    with open(cam_csv, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS, extrasaction="ignore")
        w.writeheader()
        for l in leads:
            w.writerow(l)

    cam_coms = os.path.join(pasta, f"fourlife-comunicacoes-{hoje}.json")
    with open(cam_coms, "w", encoding="utf-8") as f:
        json.dump(coms, f, ensure_ascii=False, indent=1)

    print(f"leads guardados        : {len(leads)}")
    print(f"comunicações guardadas : {len(coms)}")
    print()
    for c in (cam_csv, cam_json, cam_coms):
        print(f"  {c}  ({os.path.getsize(c):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
