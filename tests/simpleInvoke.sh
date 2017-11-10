docker exec -i cli bash <<'EOF'
peer chaincode invoke -o orderer0:7050 -C mpl -n lab_cc -c '{"Args":["invoke","a","b","1"]}'
exit
EOF
