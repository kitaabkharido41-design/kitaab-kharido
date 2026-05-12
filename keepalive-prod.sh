#!/bin/bash
cd /home/z/my-project/.next/standalone
while true; do
  if ! ss -tlnp | grep -q ":3000 "; then
    NODE_ENV=production node server.js > /home/z/my-project/server.log 2>&1 &
  fi
  sleep 3
done
