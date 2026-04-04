#!/bin/bash
cd /home/z/my-project
while true; do
  if ! ss -tlnp | grep -q ":3000 "; then
    echo "$(date): Server not running, starting..." >> /home/z/my-project/dev.log
    bun run dev >> /home/z/my-project/dev.log 2>&1 &
    BUN_PID=$!
    echo "$(date): Started with PID $BUN_PID" >> /home/z/my-project/dev.log
  fi
  sleep 5
done
