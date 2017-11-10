docker exec -i cli bash <<'EOF'
peer chaincode query -C mpl -n lab_cc -c '{"Args":["query","a"]}'
exit
EOF
