"""Apagar os leads duplicados que a reposição criou.

A rota POST /leads não verifica repetidos — a importação do mapa verifica. Entre
o apagão e a reposição, o remapeamento já tinha metido algumas empresas na base;
ao repor a cópia por cima, elas entraram uma segunda vez.

Fica a cópia mais rica de cada empresa: a que tem googlePlaceId e morada é a que
veio do mapa, e é a que serve para não voltar a duplicar no futuro.

Só junta nomes exactamente iguais na mesma cidade. Empresas diferentes que
partilham um número de telefone NÃO são tocadas — isso é outra coisa, e a fila
de disparo já garante uma mensagem por número.
"""
import collections, json, sys, urllib.request

BASE = "https://api-server-production-20c2.up.railway.app/api"
aplicar = "--aplicar" in sys.argv

with urllib.request.urlopen(f"{BASE}/leads?limit=5000", timeout=120) as r:
    leads = json.loads(r.read())

chave = lambda x: ((x.get("businessName") or "").strip().lower(), (x.get("city") or "").strip().lower())
riqueza = lambda x: (sum(1 for v in x.values() if v not in (None, "", False)), -x["id"])

grupos = collections.defaultdict(list)
for x in leads:
    grupos[chave(x)].append(x)

apagar = []
for k, g in grupos.items():
    if len(g) < 2:
        continue
    g.sort(key=riqueza, reverse=True)
    fica = g[0]
    for x in g[1:]:
        apagar.append((x["id"], x["businessName"], fica["id"]))

print(f"leads na base : {len(leads)}")
print(f"a apagar      : {len(apagar)}")
print()
for i, (id_, nome, fica) in enumerate(apagar[:10]):
    print(f"  apagar id {id_:4} ({nome[:38]}) — fica o id {fica}")
if len(apagar) > 10:
    print(f"  … e mais {len(apagar) - 10}")

if not aplicar:
    print("\nENSAIO SECO — nada foi apagado. Repetir com --aplicar.")
    sys.exit(0)

feitos = falhados = 0
for id_, _, _ in apagar:
    req = urllib.request.Request(f"{BASE}/leads/{id_}", method="DELETE")
    try:
        urllib.request.urlopen(req, timeout=40)
        feitos += 1
    except Exception as e:
        falhados += 1
        print("falhou", id_, e)
print(f"\napagados: {feitos} | falhados: {falhados}")
