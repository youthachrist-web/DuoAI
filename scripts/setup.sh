#!/usr/bin/env bash
# Sobe a stack open-source do DuoAI: OmniRoute (gateway de LLM) + Hermes Agent
# (runtime de agentes, com gateway de WhatsApp nativo) + servidor DuoAI (B2C/B2B).
# Nenhum passo aqui depende de Twilio ou de qualquer serviço pago.
set -euo pipefail

echo "== 1/3 · OmniRoute (github.com/diegosouzapw/OmniRoute) =="
if ! command -v omniroute >/dev/null 2>&1; then
  npm install -g omniroute
fi
omniroute &
OMNIROUTE_PID=$!
echo "OmniRoute rodando (PID $OMNIROUTE_PID) em http://localhost:20128"

echo "== 2/3 · Hermes Agent (github.com/NousResearch/hermes-agent) =="
if ! command -v hermes >/dev/null 2>&1; then
  curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
fi
echo "Copie agent/hermes/skills/duoai-b2c e duoai-b2b para ~/.hermes/skills/ e configure"
echo "o provedor de LLM do Hermes para apontar para OMNIROUTE_BASE_URL (ver .env.example)."
mkdir -p "$HOME/.hermes/skills"
cp -r agent/hermes/skills/duoai-b2c "$HOME/.hermes/skills/"
cp -r agent/hermes/skills/duoai-b2b "$HOME/.hermes/skills/"

echo "== 3/3 · Servidor DuoAI (frentes B2C/B2B) =="
(cd server && npm install --omit=dev --no-audit --no-fund && npm start) &
SERVER_PID=$!
echo "DuoAI server rodando (PID $SERVER_PID) em http://localhost:8787"

echo ""
echo "Stack no ar: OmniRoute (20128) · Hermes Agent · DuoAI server (8787)."
echo "Nenhum componente é pago; nenhum requer cartão de crédito para operar."
wait
