#!/bin/bash
curl -s 'https://hub.docker.com/v2/repositories/atendai/evolution-api/tags?page_size=15&ordering=last_updated' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); [print(r['name']) for r in d['results']]"
