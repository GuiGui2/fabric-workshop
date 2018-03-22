# fabric-workshop configuration files

Find here all config files files used to create the lab infrastructure using
Hyperledger Fabric v1.1

Setup will be as follows:

- One organization for Orderers, OrdererOrg.
- Two organizations for peers, Org1 and Org2.

OrdererOrg has a Root CA named OrdererRootCA, and an intermediate
OrdererIntermediateCA.
OrdererIntermediateCA will be used to enroll identities and generate
appropriate certificates after its root cert has been signed by
OrdererRootCA.

Org1 and Org2 will also have a Root CA, respectively Org1RootCA and
Org2RootCA, as well as intermediate CAs, respectively Org1IntermediateCA
and Org2IntermediateCA.
Usage will be as for the OrdererIntermediateCA.
