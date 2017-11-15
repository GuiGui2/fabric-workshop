#!/bin/bash
docker exec -i cli bash <<'EOF'
peer chaincode install -n lab_cc -v 1.0 -p chaincode/go/chaincode_example02
exit
EOF
