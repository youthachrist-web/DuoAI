"""
Ligação ao painel do DuoAI, para os scripts que correm fora do Railway.

A API deixou de ter endereço público: não tinha autenticação nenhuma e quem
soubesse o URL lia os leads todos. Agora fala-se com ela através do painel, que
pede uma chave.

A chave vem do ambiente e nunca do código:

    export DUOAI_CHAVE="a chave que o Frederico guardou"

No Windows, no PowerShell:

    $env:DUOAI_CHAVE = "a chave que o Frederico guardou"
"""

import json
import os
import sys
import urllib.error
import urllib.request

PAINEL = os.environ.get("DUOAI_PAINEL", "https://painel-novo-production-c63b.up.railway.app")
CHAVE = os.environ.get("DUOAI_CHAVE", "")


class SemChave(RuntimeError):
    pass


def pedir(caminho, dados=None, metodo=None, timeout=120):
    """Um pedido ao painel, já com a chave. `caminho` começa em /api."""
    if not CHAVE:
        raise SemChave(
            "falta a chave.\n"
            "  Linux/macOS : export DUOAI_CHAVE=\"...\"\n"
            "  PowerShell  : $env:DUOAI_CHAVE = \"...\""
        )
    corpo = json.dumps(dados).encode("utf-8") if dados is not None else None
    cabecalhos = {"Accept": "application/json", "x-chave": CHAVE}
    if corpo:
        cabecalhos["Content-Type"] = "application/json"
    req = urllib.request.Request(PAINEL + caminho, data=corpo, headers=cabecalhos, method=metodo)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        texto = r.read().decode("utf-8")
        return json.loads(texto) if texto else None


def confirmar_ligacao():
    """Falha cedo e com uma frase entendível, em vez de rebentar a meio."""
    try:
        pedir("/api/status", timeout=40)
    except SemChave as e:
        print(e)
        sys.exit(1)
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print("a chave não foi aceite — confirma o valor de DUOAI_CHAVE.")
        else:
            print(f"o painel respondeu {e.code}.")
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"não consegui falar com o painel: {e}")
        print(f"endereço em uso: {PAINEL}")
        sys.exit(1)
