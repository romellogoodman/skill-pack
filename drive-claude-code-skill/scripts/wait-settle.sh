#!/usr/bin/env bash
# Wait until a tmux pane stops changing.
# Usage: wait-settle.sh <session> [interval-seconds] [max-polls]
# Exits 0 once two captures in a row match, 1 if it gives up first.
set -u

session=${1:?usage: wait-settle.sh <session> [interval] [max-polls]}
interval=${2:-3}
max=${3:-30}

if ! tmux has-session -t "$session" 2>/dev/null; then
  echo "no tmux session named '$session'" >&2
  exit 2
fi

prev=""
for ((i = 1; i <= max; i++)); do
  cur=$(tmux capture-pane -t "$session" -p | shasum)
  if [ "$cur" = "$prev" ]; then
    echo "settled after $(((i - 1) * interval))s"
    exit 0
  fi
  prev=$cur
  sleep "$interval"
done

echo "still changing after $((max * interval))s; read the pane before acting" >&2
exit 1
