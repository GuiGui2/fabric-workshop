# Hyperledger Fabric v1.1.x sample configurations

This folder holds a set of sample configurations for Hyperledger Fabric v1.1.
The Fabric is set up as follows: 
 - 1 organization for orderers, called OrdererOrg, which admin is
 adminordererorg.
 - 2 organizations for peers, respectively called Org1 and Org2, which admins
are, respectively, adminorg1 and adminorg2.

The *.yml files are to use with docker-compose to start a Hyperledger Fabric
1.1.0 (at the time of writing) in various configurations:
 - using solo consensus (docker-compose-solo.yml)
 - using solo consensus and CouchDB as world state
   (docker-compose-solo-couch.yml)
 - using kafka consensus (docker-compose-kafka.yml)
 - using kafka consensus with CouchDB as world state
   (docker-compose-kafka-couch.yml).
