#!/usr/bin/env python3
"""
Varrer o mapa de raiz, cidade a cidade e setor a setor.

As empresas vêm do OpenStreetMap, que é público e não custa nada. Este script
pede ao painel uma corrida de prospeção para cada par cidade/setor — 26 cidades
por 18 setores, 468 pares — e vai dizendo o que entra.

Empresas que já estejam na base são reconhecidas pelo nome e não entram outra
vez, por isso correr isto duas vezes não duplica nada.

    python3 remapear-tudo.py                 # ensaio seco: mostra o plano
    python3 remapear-tudo.py --correr        # arranca
    python3 remapear-tudo.py --correr --desde 120   # retoma no par 120

É retomável de propósito. São horas de trabalho e a ligação vai falhar a certa
altura — quando falhar, o ecrã diz em que par ficou e recomeça-se de lá.

Precisa da chave do painel em DUOAI_CHAVE. Ver duoai.py.
"""

import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from duoai import confirmar_ligacao, pedir  # noqa: E402

# Quantas empresas pedir por par.
LIMITE_POR_PAR = 15

# Pausa entre corridas. O Overpass é um serviço público e gratuito, e cerca de um
# quinto das consultas já falha por sobrecarga sem ajuda nenhuma nossa. Isto não é
# excesso de zelo: é o que faz a diferença entre uma varredura que acaba e uma que
# apanha 429 a meio e não traz nada.
PAUSA_S = 12

# Quanto esperar por uma corrida antes de desistir dela e seguir para a seguinte.
ESPERA_MAX_S = 180

CIDADES = [
    "Joinville", "Blumenau", "Itajaí", "Navegantes", "Balneário Camboriú",
    "Penha", "Barra Velha", "Camboriú", "Porto Belo", "Itapema",
    "Balneário Piçarras", "Tijucas", "Itapoá", "Araquari", "Guabiruba",
    "Brusque", "Antônio Carlos", "Biguaçu", "São José", "Palhoça",
    "Florianópolis", "São Paulo", "Canoas", "Gravataí", "Cachoeirinha",
    "Sapucaia do Sul",
]

# Ordenados pelo que costuma render mais primeiro: se a varredura for interrompida,
# o que já entrou é o que vale mais.
SETORES = [
    "Metalurgia e Fundição",
    "Construção Civil e Obras Públicas",
    "Indústria Transformadora e Manufatura",
    "Estruturas Metálicas e Carpintaria",
    "Logística e Armazéns",
    "Transporte de Cargas e Ferroviário",
    "Manutenção Industrial e Eletromecânica",
    "Setor Alimentar Industrial",
    "Gestão de Resíduos e Limpeza Urbana",
    "Indústria Química e Farmacêutica",
    "Estaleiros Navais",
    "Serviços Portuários e Estiva",
    "Indústria Papeleira e Celulose",
    "Extração e Pedreiras",
    "Clínicas Médicas e Ambulatórios",
    "Clínicas de Medicina Ocupacional",
    "Fisioterapia e Reabilitação",
    "Academias",
]


def total_leads():
    return pedir("/api/leads/facets", timeout=60).get("total")


def pares():
    # Setor por setor, cidade por cidade: assim um setor que rende entra em todas
    # as cidades antes de se passar ao seguinte.
    return [(s, c) for s in SETORES for c in CIDADES]


def esperar_corrida(run_id):
    """Espera que a corrida acabe. Devolve (estado, achou, importou)."""
    limite = time.time() + ESPERA_MAX_S
    while time.time() < limite:
        time.sleep(5)
        try:
            r = pedir(f"/api/prospecting/runs/{run_id}", timeout=40)
        except Exception:
            continue
        estado = r.get("status")
        if estado in ("completed", "failed"):
            return estado, r.get("foundCount") or 0, r.get("importedCount") or 0
    return "timeout", 0, 0


def main():
    correr = "--correr" in sys.argv
    desde = 0
    if "--desde" in sys.argv:
        try:
            desde = int(sys.argv[sys.argv.index("--desde") + 1])
        except (IndexError, ValueError):
            print("--desde precisa de um número")
            return 1

    lista = pares()[desde:]

    print(f"pares a varrer: {len(lista)}  (de {len(pares())} no total)")
    print(f"pausa entre corridas: {PAUSA_S}s")
    print(f"tempo estimado: ~{len(lista) * (PAUSA_S + 25) / 3600:.1f} horas")
    print()

    if not correr:
        print("── ENSAIO SECO ──")
        print("Primeiros cinco pares:")
        for s, c in lista[:5]:
            print(f"  {c} / {s}")
        print()
        print("Para arrancar: python3 remapear-tudo.py --correr")
        return 0

    confirmar_ligacao()
    antes = total_leads()
    print(f"leads antes: {antes}")
    print()

    entraram = 0
    for i, (setor, cidade) in enumerate(lista, start=desde + 1):
        etiqueta = f"#{i:<4} {cidade[:20]:20} {setor[:34]:34}"
        try:
            r = pedir(
                "/api/prospecting/runs",
                {"niche": setor, "city": cidade, "limit": LIMITE_POR_PAR},
                timeout=60,
            )
            run_id = (r or {}).get("id")
        except Exception as e:
            print(f"{etiqueta} SEM-ARRANQUE  {str(e)[:50]}")
            time.sleep(PAUSA_S)
            continue

        if not run_id:
            print(f"{etiqueta} SEM-ID")
            time.sleep(PAUSA_S)
            continue

        estado, achou, importou = esperar_corrida(run_id)
        entraram += importou
        print(f"{etiqueta} {estado:9} achou {achou:3}  importou {importou:3}   (total novo: {entraram})")
        time.sleep(PAUSA_S)

    print()
    try:
        depois = total_leads()
        print(f"leads antes: {antes}  →  depois: {depois}   (+{depois - antes})")
    except Exception:
        print(f"importados nesta passagem: {entraram}")

    print()
    print("Se ficou a meio, retoma com:")
    print(f"  python3 remapear-tudo.py --correr --desde {desde + len(lista)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
