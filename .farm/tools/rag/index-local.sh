#!/usr/bin/env bash
set -euo pipefail
OUT=.farm/tools/rag/corpus.txt
> "$OUT"
while read -r pattern; do
  rg --no-heading --line-number "$pattern" | sed 's/^/>> /' >> "$OUT" || true
done < .farm/tools/rag/patterns.txt
echo "Wrote $OUT"
