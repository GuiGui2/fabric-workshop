docker exec -i cli bash <<'EOF'
peer chaincode instantiate -o orderer0:7050 -C mpl -n lab_cc -v 1.0 -c '{"Args":["init","a","100","b","200"]}' -P "OR('BlockChainCoCMSP.member')"
exit
EOF
