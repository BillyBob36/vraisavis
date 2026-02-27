#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)

node_cmd='
const fs = require("fs");
const c = fs.readFileSync("/evolution/dist/main.js", "utf8");
const i = c.indexOf("Group Ignore");
if (i > -1) {
  console.log("=== Context around Group Ignore ===");
  console.log(c.substring(i-100, i+1500));
}
'

echo "$node_cmd" > /tmp/read_main.js
docker cp /tmp/read_main.js $EVO:/tmp/read_main.js
docker exec $EVO node /tmp/read_main.js 2>/dev/null | head -80
