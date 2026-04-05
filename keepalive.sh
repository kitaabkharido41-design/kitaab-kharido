#!/bin/bash
# Keepalive script for the dev server
cd /home/z/my-project
while true; do
  if ! pgrep -f "next dev" > /dev/null; then
    echo "$(date): Server not running, starting..." >> /home/z/my-project/server.log
    rm -f dev.log
    bun run dev > /dev/null 2>&1 &
    disown
  fi
  sleep 10
done
