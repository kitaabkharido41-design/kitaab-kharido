#!/bin/bash
# Keepalive + health check script for the dev server
cd /home/z/my-project
while true; do
  if ! pgrep -f "next dev" > /dev/null; then
    echo "$(date): Server not running, starting..." >> /home/z/my-project/server.log
    rm -f dev.log
    bun run dev > dev.log 2>&1 &
    disown
    # Wait for server to be ready
    for i in $(seq 1 30); do
      sleep 1
      if curl -s --max-time 2 -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
        echo "$(date): Server ready" >> /home/z/my-project/server.log
        break
      fi
    done
  fi
  # Keep server warm by hitting it periodically
  curl -s --max-time 3 -o /dev/null http://localhost:3000/api/books > /dev/null 2>&1
  sleep 15
done
