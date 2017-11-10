echo "Create a Channel"
docker exec -i cli bash <<'EOF'
peer channel create -o orderer0:7050 -c mpl -f mpl.tx
exit
EOF

