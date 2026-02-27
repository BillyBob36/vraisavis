#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)

# Change LOG_BAILEYS to show all output including Baileys internal
docker exec $EVO sh -c "
# Hook into the running process to see what's happening
# Look at what the ChannelStartupService does
node -e \"
const path = '/evolution/dist';
// Find the channel startup service file
const fs = require('fs');
const files = fs.readdirSync(path);
files.forEach(f => {
  if (f.includes('channel') || f.includes('Channel') || f.includes('startup') || f.includes('Startup')) {
    console.log(f);
  }
});
\"" 2>/dev/null

echo "=== Dist files ==="
docker exec $EVO ls /evolution/dist/ 2>/dev/null | head -20
