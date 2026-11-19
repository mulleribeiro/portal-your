#!/usr/bin/env bash
# Wrapper compatível com o adaptador OpenNext (não usa mais o proxy ORIGIN).
set -euo pipefail
cd "$(dirname "$0")"
node scripts/cloudflare.mjs build
if [[ "${1:-}" == "--deploy" ]]; then
  node scripts/cloudflare.mjs deploy
fi
