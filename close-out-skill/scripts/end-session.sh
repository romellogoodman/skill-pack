#!/usr/bin/env bash
# End the Claude Code session this script is running inside.
# Walks up from this shell to the claude process that owns it and sends
# SIGTERM, which Claude Code handles as a clean exit (usually within a
# second). Run it as the very last action of /close-out, after the farewell
# is already on screen. Refuses to run outside a Claude Code session.
set -uo pipefail

self=""
x=$$
while [ "$x" -gt 1 ]; do
  c=$(ps -o comm= -p "$x" 2>/dev/null || true)
  if [ "$c" = claude ]; then self=$x; break; fi
  x=$(ps -o ppid= -p "$x" 2>/dev/null | tr -d ' ' || true)
  [ -n "$x" ] || break
done

[ -n "$self" ] || { echo "end-session.sh: not running inside a Claude Code session" >&2; exit 1; }
echo "ending session $self"
exec kill -TERM "$self"
