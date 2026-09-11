#!/usr/bin/env python3
"""
Cópia diária dos leads e das comunicações, para fora do Railway.

Isto existe porque a base já se perdeu duas vezes — as duas pela mesma razão, um
Postgres a correr sem disco permanente. O disco está montado desde 11 de setembro
de 2026 e essa causa está fechada. Mas o disco protege de um reinício, não de um
engano, e uma cópia que ninguém faz não é uma cópia.

Guarda três ficheiros com a data no nome, e nunca sobrescreve o de outro dia:

    fourlife-leads-AAAA-MM-DD.csv     — para abrir e ler
    fourlife-leads-AAAA-MM-DD.json    — todos os campos, para restaurar
    fourlife-comunicacoes-AAAA-MM-DD.json

    python3 backup-diario.py                    # guarda na pasta actual
    python3 backup-diario.py ~/Drive/fourlife   # guarda onde quiseres

Precisa da chave do painel em DUOAI_CHAVE. Ver duoai.py.

## Para correr sozinho todos os dias

macOS ou Linux — `crontab -e` e acrescenta (todos os dias às 23h):

    0 23 * * * DUOAI_CHAVE="..." /usr/bin/python3 /caminho/backup-diario.py /caminho/pasta

Windows — Agendador de Tarefas, tarefa diária, programa `python`, argumentos o
caminho do script e da pasta, com DUOAI_CHAVE nas variáveis de ambiente do
utilizador.

**Aponta a pasta para dentro do Drive, Dropbox ou OneDrive.** Uma cópia no mesmo
computador não é uma cópia: é o mesmo disco a poder falhar duas vezes.
"""

import csv
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from duoai import confirmar_ligacao, pedir  # noqa: E402

CAMPOS = [
    "id", "businessName", "city", "niche", "tier", "score",
    "phone", "whatsapp", "email", "website", "address",
    "stage", "source", "sourceQuery", "googlePlaceId",
    "lastContactedAt", "ultimoWhatsApp", "optOutAt",
]


def lista_de(dados, *chaves):
    if isinstance(dados, list):
        return dados
    for k in chaves:
        v = (dados or {}).get(k)
        if isinstance(v, list):
            return v
    return []


def main():
    pasta = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(pasta, exist_ok=True)
    hoje = datetime.date.today().isoformat()

    confirmar_ligacao()
    leads = lista_de(pedir("/api/leads?limit=20000", timeout=300), "leads", "data")
    coms = lista_de(pedir("/api/communications?limit=50000", timeout=300), "communications", "data")

    # Uma base vazia nunca sobrescreve nada. Se o painel responder com zero leads
    # é muito mais provável que algo esteja em baixo do que a operação ter
    # desaparecido — e uma cópia de zero gravada por cima da de ontem é pior do
    # que não haver cópia nenhuma.
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
