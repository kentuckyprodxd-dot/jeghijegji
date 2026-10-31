#!/bin/sh
# macOS / Linux: ./porneste.sh numele_tau
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Lipsește Node.js. Instalează-l de pe https://nodejs.org (LTS)."; exit 1; }
[ -d node_modules ] || npm install --no-fund --no-audit
node server.mjs "$@"
