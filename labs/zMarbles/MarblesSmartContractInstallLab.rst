Section 1 - Overview of Hyperledger Fabric Smart Contract installation lab
==========================================================================
In this lab, you will use the Hyperledger Fabric instance that you installed and tested in the previous lab, “Hyperledger Fabric 
installation and verification on IBM Z”.

You will use Docker Compose to bring up a Fabric network in which two organizations will participate.  There will be one orderer 
service for the network, and each organization will use its own certificate authority service and have two peer nodes.  Each peer node 
will use CouchDB for its ledger store. Each of these entities will run in a separate Docker container.  That makes eleven Docker 
containers, as follows:

*	1 orderer service Docker container
*	2 certificate authority (CA) Docker containers (one for each organization)
*	4 peer node Docker containers  (each of the two organizations has two peers)
*	4 CouchDB Docker containers (each Peer node has its own separate CouchDB ledger store)

You will also bring up a twelfth Docker container that we will call the *CLI* container.  You will use it as a convenience to enter 
Hyperledger Fabric commands targeted to specific peers.  You will see how this is done later in the lab.

The network you bring up will use Transport Layer Security (TLS) which provides secure, encrypted communication between the peer nodes 
and the orderer, just as most real-world implementations will require.

You will **install** a Smart Contract on the peer nodes, **instantiate** the Smart Contract, and **invoke** functions of the Smart
Contract.  I will explain later in the lab the difference between the install and instantiate actions and what each one does.

When you invoke functions of the Smart Contract, some of them will produce transactions on the blockchain and some of them will not.   
*Spoiler alert*:  Functions that create, update or delete ledger data always produce a transaction, while functions that only query ledger data do not.  
 
Section 2	- Description of the subsequent sections in this lab
==============================================================
This section provides a brief description of the subsequent sections in the lab, where you will get hands-on experience with the Hyperledger Fabric command line interface.

1.	You will extract the artifacts necessary to run the lab in Section 3.  All the artifacts necessary for the lab are provided in a zip file.  
2.	You will use Docker Compose to bring up the twelve Docker containers that comprise the Hyperledger Fabric network in Section 4.  You will see that all twelve Docker containers that we mentioned in Section 1 are brought up with a single docker-compose command, and I will explain some of the more interesting bits of what is going on under the covers.
3.	You will create a channel in the Hyperledger Fabric network in Section 5.  In Hyperledger Fabric v1.0, each channel is essentially its own blockchain.  
4.	You will instruct each peer node to join the channel in Section 6.  We will join all four Peer nodes to the channel.  Peer nodes can be members of more than one channel, but for our lab we are only creating one channel.
5.	You will define an “anchor” peer for each organization in the channel in Section 7.  An anchor peer for an organization is a peer that is known by all the other organizations in a channel.  Not all peers for an organization need to be known by outside organizations.  Peers not defined as anchor peers are visible only within their own organization.
6.	You will install the Smart Contract, or chaincode, on the peer nodes in Section 8. Installing chaincode simply puts the chaincode executable on the file system of the peer.  It is a necessary step before you execute that chaincode on the peer, but the next step is also required.
7.	You will instantiate the chaincode on the channel in Section 9.  This step is a prerequisite to being able to run chaincode on a channel.  It only needs to be performed on one peer that is a member of the channel.  This causes a transaction to be recorded on the channel’s blockchain to indicate that the chaincode can be run on the channel.
8.	You will invoke functions on the chaincode that will create, read, update and delete (CRUD) data stored on the blockchain in Section 10. If you hear programmers use the word CRUD, unless they are talking about last night’s hockey game, they are probably talking about Creating, Reading, Updating, or Deleting data.   Blocks of transactions in a blockchain are always added (i.e., Created), and they can be Read, but they should never, ever, ever, in normal operations, be Updated or Deleted.   However, although the blocks in a chain are not updated or deleted, the transactions themselves operate on Key/Value pairs that can have all CRUD operations performed on them.  This collection of Key/Value pairs is often referred to as state data. 


 
Section 3 -	Extract the artifacts necessary to run the lab
==========================================================

**Step 1:**	Navigate to the home directory by entering *cd ~* (the “tilde” character, i.e., ‘*~*’, represents the user’s home directory in Linux).  
This directory is also usually set in the $HOME environment variable, so *cd $HOME* will also usually get you to your home directory.  
E.g., observe the following commands which illustrate this::
 bcuser@ubuntu-bc:~$ cd /usr/lib
 bcuser@ubuntu-bc:/usr/lib$ # starting in some random dir
 bcuser@ubuntu-bc:/usr/lib$ # bash interprets '#' as starting a comment
 bcuser@ubuntu-bc:/usr/lib$ pwd # prints the current directory you are in
 /usr/lib
 bcuser@ubuntu-bc:/usr/lib$ cd ~ # will take you to your home directory
 bcuser@ubuntu-bc:~$ pwd
 /home/bcuser
 bcuser@ubuntu-bc:~$ cd - # takes you back to the previous directory 
 /usr/lib
 bcuser@ubuntu-bc:/usr/lib$ echo $HOME # print your HOME environment variable
 /home/bcuser
 bcuser@ubuntu-bc:/usr/lib$ cd $HOME # will be the same as cd ~
 bcuser@ubuntu-bc:~$ pwd
 /home/bcuser
 bcuser@ubuntu-bc:~$
 
**Step 2:** Retrieve the zmarbles compressed tarball prepared for this lab with the following command::

 bcuser@ubuntu16042:~$ wget https://raw.githubusercontent.com/silliman/fabric-lab-IBM-Z/master/zmarbles.tar.gz
 --2017-10-02 08:40:14--  https://raw.githubusercontent.com/silliman/fabric-lab-IBM-Z/master/zmarbles.tar.gz
 Resolving raw.githubusercontent.com (raw.githubusercontent.com)... 151.101.200.133
 Connecting to raw.githubusercontent.com (raw.githubusercontent.com)|151.101.200.133|:443... connected.
 HTTP request sent, awaiting response... 200 OK
 Length: 1532078 (1.5M) [application/octet-stream]
 Saving to: 'zmarbles.tar.gz'
 
 zmarbles.tar.gz                      100%[=====================================================================>]   1.46M  --.-KB/s     in 0.1s    

 2017-10-02 08:40:15 (14.0 MB/s) - 'zmarbles.tar.gz' saved [1532078/1532078]
 
**Step 3:**	List the *zmarbles* directory with this *ls* command::

 bcuser@ubuntu-bc:~$ ls zmarbles     
 ls: cannot access 'zmarbles': No such file or directory
 
Don’t panic!  It wasn’t supposed to be there.  It will be after the next step.

**Step 4:**	Extract the *zmarbles.tar.gz* file which will create the missing directory (and lots of subdirectories).  
If you are not giddy yet, try tucking the “*v*” switch into the options in the command below.  That is, use *-xzvf* instead of *-xzf*.  
So, enter the commands highlighted below as shown, or by substituting *-xzvf* for *-xzf* in the tar command (the “*v*” is for “*verbose*”)
::

 bcuser@ubuntu16042:~$ tar -xzf zmarbles.tar.gz 
 bcuser@ubuntu16042:~$ ls zmarbles
 base               configtx.yaml       docker-compose-template.yaml  generateArtifacts.sh  network_setup.sh
 channel-artifacts  crypto-config.yaml  examples                      marblesUI             scripts
 bcuser@ubuntu16042:~$

Congratulations!  You are now ready to get to the hard part of the lab!  Proceed to the next section please.  
 
Section 4	- Bring up the twelve Docker containers that comprise the Hyperledger Fabric network
==============================================================================================

**Step 1:**	Change to the *zmarbles* directory with the *cd* command and then list its contents with the *ls* command::

 bcuser@ubuntu16042:~$ cd zmarbles/ 
 bcuser@ubuntu16042:~/zmarbles$ ls -l
 total 48
 drwxr-xr-x  2 bcuser bcuser 4096 Jul 12 21:10 base
 drwxr-xr-x  2 bcuser bcuser 4096 Jul 13 11:28 channel-artifacts
 -rw-r--r--  1 bcuser bcuser 5017 Jun 18 12:38 configtx.yaml
 -rw-r--r--  1 bcuser bcuser 3861 Jun 18 12:40 crypto-config.yaml
 -rw-rw-r--  1 bcuser bcuser 5996 Jul 13 11:23 docker-compose-template.yaml
 drwxr-xr-x  3 bcuser bcuser 4096 Jun 18 12:32 examples
 -rwxr-xr-x  1 bcuser bcuser 3611 Jun 18 16:49 generateArtifacts.sh
 drwxr-xr-x 12 bcuser bcuser 4096 Jul 13 11:32 marblesUI
 -rwxr-xr-x  1 bcuser bcuser 2504 Jun 18 12:54 network_setup.sh
 drwxr-xr-x  2 bcuser bcuser 4096 Jul 12 19:05 scripts bcuser@ubuntu16042:~/zmarbles$
 
**Step 2:**	You are going to run a script named *generateArtifacts.sh* that will create some configuration information that is 
necessary to get your Hyperledger Fabric network set up.  There is one optional parameter you may pass to the script, and that is the 
name of the channel you will be creating.  If you do not specify this parameter, the channel name defaults to *mychannel*. You may 
choose to specify your own channel name.  If you do so, then in the remainder of this lab, anytime you see *mychannel* within the
command, you will need to substitute the name you have chosen to use here.  E.g., if you wish to name your channel *Tim*, then you will 
enter *./generateArtifacts.sh Tim* instead of just *./generateArtifacts.sh* as shown in the below snippet.

Here is my advice on that-  if you are reading this on a “softcopy” medium where you have the ability to cut and paste, just use the
default channel name so you can cut and paste subsequent commands in one fell swoop.  If you have a printed copy of the lab, you will 
have to type the commands in anyway, so maybe it is okay to give it your own special name.

So, enter just *one* of these two commands (the first one is recommended)::

 ./generateArtifacts.sh    # will use the default channel name of mychannel
 ./generateArtifacts.sh yourFancyChannelName   # please pick a shorter name for your own sake!

By the way, if you enter a command and end it with #, everything after the # is considered a comment and is ignored by the shell.  
So, if you see me place comments after any commands you do not have to enter them but if you do, it will not hurt anything.  

Here is output from entering the first command,  which does not specify the channel name and thus accepts the default name of *mychannel*::

 bcuser@ubuntu-bc:~/zmarbles$ ./generateArtifacts.sh  # not all output is shown below
 mychannel
 
 Using cryptogen -> /home/bcuser/git/src/github.com/hyperledger/fabric/release/linux-s390x/bin/cryptogen 

 ########################################################## 
 ##### Generate certificates using cryptogen tool #########
 ##########################################################
 unitedmarbles.com
 marblesinc.com
 
 Using configtxgen -> /home/bcuser/git/src/github.com/hyperledger/fabric/release/linux-s390x/bin/configtxgen
 ##########################################################
 #########  Generating Orderer Genesis block ##############
 ##########################################################
 2017-06-18 17:21:14.028 EDT [common/configtx/tool] main -> INFO 001 Loading configuration
 2017-06-18 17:21:14.068 EDT [common/configtx/tool] doOutputBlock -> INFO 00b Generating genesis block
 2017-06-18 17:21:14.069 EDT [common/configtx/tool] doOutputBlock -> INFO 00c Writing genesis block 

 ################################################################# 
 ### Generating channel configuration transaction 'channel.tx' ###
 #################################################################
 2017-06-18 17:21:14.081 EDT [common/configtx/tool] main -> INFO 001 Loading configuration
 2017-06-18 17:21:14.084 EDT [common/configtx/tool] doOutputChannelCreateTx -> INFO 002 Generating new channel configtx
 2017-06-18 17:21:14.084 EDT [common/configtx/tool] doOutputChannelCreateTx -> INFO 003 Writing new channel tx 

 ################################################################# 
 #######    Generating anchor peer update for Org0MSP   ########## 
 #################################################################
 2017-06-18 17:21:14.095 EDT [common/configtx/tool] main -> INFO 001 Loading configuration
 2017-06-18 17:21:14.098 EDT [common/configtx/tool] doOutputAnchorPeersUpdate -> INFO 002 Generating anchor peer update
 2017-06-18 17:21:14.098 EDT [common/configtx/tool] doOutputAnchorPeersUpdate -> INFO 003 Writing anchor peer update

 #################################################################
 #######    Generating anchor peer update for Org1MSP   ##########
 #################################################################
 2017-06-18 17:21:14.110 EDT [common/configtx/tool] main -> INFO 001 Loading configuration
 2017-06-18 17:21:14.113 EDT [common/configtx/tool] doOutputAnchorPeersUpdate -> INFO 002 Generating anchor peer update
 2017-06-18 17:21:14.113 EDT [common/configtx/tool] doOutputAnchorPeersUpdate -> INFO 003 Writing anchor peer update

This script calls two Hyperledger Fabric utilites- *cryptogen*, which creates security material (certificates and keys) 
and *configtxgen* (Configuration Transaction Generator), which is called four times, to create four things::

1.	An **orderer genesis block** – this will be the first block on the orderer’s system channel. The location of this block is 
specified to the Orderer when it is started up via the ORDERER_GENERAL_GENESISFILE environment variable.

2.	A **channel transaction** – later in the lab, this is sent to the orderer and will cause a new channel to be created when you run 
the **peer channel create** command.

3.	An **anchor peer update** for Org0MSP.  An anchor peer is a peer that is set up so that peers from other organizations may 
communicate with it.  The concept of anchor peers allows an organization to create multiple peers, perhaps to provide extra capacity 
or throughput or resilience (or all the above) but not have to advertise this to outside organizations.

4.	An anchor peer update for Org1MSP.   You will perform the anchor peer updates for both Org0MSP and Org1MSP later in the lab 
via **peer channel create** commands.

**Step 3:**	Issue the following command which will show you all files that have been modified in the last 15 minutes::

 bcuser@ubuntu-bc:~/zmarbles$ find . -name '*' -mmin -15
 ./docker-compose.yaml
  .
  .  # lots of cryptographic material in crypto-config/
  .
 ./channel-artifacts/Org0MSPanchors.tx
 ./channel-artifacts/Org1MSPanchors.tx
 ./channel-artifacts/genesis.block
 ./channel-artifacts/channel.tx

These are the files that have been created from running the *generateArtifacts.sh* script in the previous step. You will see later 
how some of them are used.

**Step 4:**	You are going to look inside the Docker Compose configuration file a little bit.   Enter the following command::

 vi -R docker-compose.yaml  

You can enter ``Ctrl-f`` to scroll forward in the file and ``Ctrl-b`` to scroll back in the file.  The *-R* flag opens the file in 
read-only mode, so if you accidentally change something in the file, it’s okay.  It will not be saved.

The statements within *docker-compose.yaml* are in a markup language called *YAML*, which stands 
for *Y*\ et *A*\ nother *M*\ arkup *L*\ anguage.  (Who says nerds do not have a sense of humor).  We will go over some highlights here.

There are twelve “services”, or Docker containers, defined within this file.  They all start in column 3 and have several statements
to describe them.  For example, the first service defined is **ca0**, and there are *image*, *environment*, *ports*, *command*, *volumes*, and 
*container_name* statements that describe it.  If you scroll down in the file with ``Ctrl-f`` you will see all the services.  Not 
every service has the same statements describing it.

The twelve services are:

**ca0** – The certificate authority service for “Organization 0” (unitedmarbles.com)

**ca1** – The certificate authority service for “Organization 1” (marblesinc.com)

**orderer.blockchain.com** – The single ordering service that both organizations will use

**peer0.unitedmarbles.com** – The first peer node for “Organization 0”	

**peer1.unitedmarbles.com** – The second peer node for “Organization 0”	

**peer0.marblesinc.com** – The first peer node for “Organization 1”	

**peer1.marblesinc.com** – The second peer node for “Organization 1”	

**couchdb0** – The CouchDB server for peer0.unitedmarbles.com  

**couchdb1** – The CouchDB server for peer1.unitedmarbles.com  

**couchdb2** – The CouchDB server for peer0.marblesinc.com

**couchdb3** – The CouchDB server for peer1.marblesinc.com

**cli** – The Docker container from which you will enter Hyperledger Fabric command line interface (CLI) commands targeted 
towards a peer node.

I will describe how several statements work within the file, but time does not permit me to address every single line in the file!

*image* statements define which Docker image file the Docker container will be created from.  Basically, the Docker image file is a 
static file that, once created, is read-only.  A Docker container is based on a Docker image, and any changes to the file system 
within a Docker container are stored within the container.  So, multiple Docker containers can be based on the same Docker image, 
and each Docker container keeps track of its own changes.  For example, the containers built for the **ca0** and **ca1** service will 
be based on the *hyperledger/fabric-ca:latest* Docker image because they both have this statement in their definition::

        image: hyperledger/fabric-ca    

*environment* statements define environment variables that are available to the Docker container.  The Hyperledger Fabric processes 
make ample use of environment variables.  In general, you will see that the certificate authority environment variables start with 
*FABRIC_CA*, the orderer’s environment variables start with *ORDERER_GENERAL*, and the peer node’s environment variables start with 
*CORE*.  These variables control behavior of the Hyperledger Fabric code, and in many cases, will override values that are specified 
in configuration files. Notice that all the peers and the orderer have an environment variable to specify that TLS is 
enabled-   *CORE_PEER_TLS_ENABLED=true* for the peers and *ORDERER_GENERAL_TLS_ENABLED=true* for the orderer.  You will notice there 
are other TLS-related variables to specify private keys, certificates and root certificates.

*ports* statements map ports on our Linux on IBM Z host to ports within the Docker container.  The syntax is *<host port>:<Docker 
container port>*.  For example, the service for **ca1** has this port statement::
 
     ports:
       - "8054:7054"

This says that port 7054 in the Docker container for the **ca1** node will be mapped to port 8054 on your Linux on IBM Z host.   This 
is how you can run two CA nodes in two Docker containers and four peer nodes in four Docker containers and keep things straight-  
within each CA node they are both using port 7054, and within each peer node Docker container, they are all using port 7051 for the 
same thing, but if you want to get to one of the peers from your host or even the outside world, you would target the appropriate 
host-mapped port. **Note:** To see the port mappings for the peers you have to look in *base/docker-compose.yaml*.  See if you can 
figure out why.

*container_name* statements are used to create hostnames that the Docker containers spun up by the docker-compose command use to 
communicate with each other.  A separate, private network will be created by Docker where the 12 Docker containers can communicate 
with each other via the names specified by *container_name*.  So, they do not need to worry about the port mappings from the *ports* 
statements-  those are used for trying to get to the Docker containers from outside the private network created by Docker.

*volumes* statements are used to map file systems on the host to file systems within the Docker container.  Just like with ports, the 
file system on the host system is on the left and the file system name mapped within the Docker container is on the right. For 
example, look at this statement from the **ca0** service::
 
     volumes:
       - ./crypto-config/peerOrganizations/unitedmarbles.com/ca/:/etc/hyperledger/fabric-ca-server-config

The security-related files that were created from the previous step where you ran *generateArtifacts.sh* were all within 
the *crypto-config* directory on your Linux on IBM Z host.  The prior *volumes* statement is how this stuff is made accessible to the 
**ca1** service that will run within the Docker container.   Similar magic is done for the other services as well, except for 
the CouchDB services.

*extends* statements are used by the peer nodes.  What this does is merge in other statements from another file.  For example, you 
may notice that the peer nodes do not contain an images statement.  How does Docker know what Docker image file to base the 
container on?  That is defined in the file, *base/peer-base.yaml*, specified in the *extends* section of *base/docker-compose.yaml*, 
which is specified in the *extends* section of *docker-compose.yaml* for the peer nodes.

*command* statements define what command is run when the Docker container is started.  This is how the actual Hyperledger Fabric 
processes get started.  You can define default commands when you create the Docker image.  This is why you do not see *command*
statements for the **cli** service or for the CouchDB services.   For the peer nodes, the command statement is specified in the 
*base/peer-base.yaml* file.

*working_dir* statements define what directory the Docker container will be in when its startup commands are run.  Again, defaults 
for this can be defined when the Docker image is created. 

When you are done reviewing the *docker-compose.yaml* file, exit the *vi* session by typing ``:q!``  (that’s “colon”, “q”, 
“exclamation point”) which will exit the file and discard any changes you may have accidentally made while browsing through the file.  
If ``:q!`` doesn’t work right away, you may have to hit the escape key first before trying it.  If that still doesn’t work, ask an 
instructor for help-  *vi* can be tricky if you are not used to it.

If you would like to see what is in the *base/docker-compose-base.yaml* and *base/peer-base.yaml* files I mentioned, take a quick 
peek with ``vi -R base/docker-compose-base.yaml`` and ``vi -R base/peer-base.yaml`` and exit with the ``:q!`` key sequence when you 
have had enough.

**Step 5:**	Start the Hyperledger Fabric network by entering the command shown below::

 bcuser@ubuntu16042:~/zmarbles$ docker-compose up -d
 Creating network "zmarbles_default" with the default driver
 Creating couchdb0 ... 
 Creating couchdb1 ... 
 Creating orderer.blockchain.com ... 
 Creating couchdb0
 Creating couchdb1
 Creating orderer.blockchain.com
 Creating couchdb2 ... 
 Creating ca_Org0 ... 
 Creating couchdb2
 Creating couchdb3 ... 
 Creating ca_Org0
 Creating ca_Org1 ... 
 Creating couchdb3
 Creating ca_Org1 ... done
 Creating peer0.unitedmarbles.com ... 
 Creating peer0.marblesinc.com ... 
 Creating peer1.marblesinc.com ... 
 Creating peer1.unitedmarbles.com ... 
 Creating peer1.marblesinc.com
 Creating peer0.marblesinc.com
 Creating peer0.unitedmarbles.com
 Creating peer0.marblesinc.com ... done
 Creating cli ... 
 Creating cli ... done

**Step 6:**	Verify that all twelve services are *Up* and none of them say *Exited*.  The *Exited* status means something went 
wrong, and you should check with an instructor for help if you see any of them in *Exited* status.

If, however, all twelve of your Docker containers are in *Up* status, as in the output below, you are ready to proceed to the next 
section::

 bcuser@ubuntu-bc:~/zmarbles$ docker ps -a
 CONTAINER ID        IMAGE                        COMMAND                  CREATED             STATUS              PORTS                                              NAMES
 fbe81505b8a2        hyperledger/fabric-tools     "/bin/bash"              3 minutes ago       Up 3 minutes                                                           cli
 2117492e94aa        hyperledger/fabric-peer      "peer node start"        3 minutes ago       Up 3 minutes        0.0.0.0:8051->7051/tcp, 0.0.0.0:8053->7053/tcp     peer1.unitedmarbles.com
 edbdf1ab0521        hyperledger/fabric-peer      "peer node start"        3 minutes ago       Up 3 minutes        0.0.0.0:7051->7051/tcp, 0.0.0.0:7053->7053/tcp     peer0.unitedmarbles.com
 e32d0cf014a8        hyperledger/fabric-peer      "peer node start"        3 minutes ago       Up 3 minutes        0.0.0.0:9051->7051/tcp, 0.0.0.0:9053->7053/tcp     peer0.marblesinc.com
 5007b908c088        hyperledger/fabric-peer      "peer node start"        3 minutes ago       Up 3 minutes        0.0.0.0:10051->7051/tcp, 0.0.0.0:10053->7053/tcp   peer1.marblesinc.com
 00216a720f03        hyperledger/fabric-ca        "sh -c 'fabric-ca-ser"   3 minutes ago       Up 3 minutes        0.0.0.0:7054->7054/tcp                             ca_Org0
 e8c7cf2d2e43        hyperledger/fabric-ca        "sh -c 'fabric-ca-ser"   3 minutes ago       Up 3 minutes        0.0.0.0:8054->7054/tcp                             ca_Org1
 45820a99b449        hyperledger/fabric-orderer   "orderer"                3 minutes ago       Up 3 minutes        0.0.0.0:7050->7050/tcp                             orderer.blockchain.com
 b350e0d256e5        hyperledger/fabric-couchdb   "tini -- /docker-entr"   3 minutes ago       Up 3 minutes        4369/tcp, 9100/tcp, 0.0.0.0:6984->5984/tcp         couchdb1
 9ae2a7718348        hyperledger/fabric-couchdb   "tini -- /docker-entr"   3 minutes ago       Up 3 minutes        4369/tcp, 9100/tcp, 0.0.0.0:7984->5984/tcp         couchdb2
 587eab66c818        hyperledger/fabric-couchdb   "tini -- /docker-entr"   3 minutes ago       Up 3 minutes        4369/tcp, 9100/tcp, 0.0.0.0:8984->5984/tcp         couchdb3
 611e754f83e7        hyperledger/fabric-couchdb   "tini -- /docker-entr"   3 minutes ago       Up 3 minutes        4369/tcp, 9100/tcp, 0.0.0.0:5984->5984/tcp         couchdb0

Section 5	- Create a channel in the Hyperledger Fabric network
==============================================================
In a Hyperledger Fabric v1.0 network, multiple channels can be created.  Each channel can have its own policies for things such as 
requirements for endorsement and what organizations may join the channel.  This allows for a subset of network participants to 
participate in their own channel.  

Imagine a scenario where OrgA, OrgB and OrgC are three organizations participating in the network. You could set up a channel in which 
all three organizations participate.   You could also set up a channel where only OrgA and OrgB participate.   In this case, the peers 
in OrgC would not see the transactions occurring in that channel.    OrgA could participate in another channel with only OrgC, in 
which case OrgB does not have visibility.  And so on.  

You could create channels with the same participants, but have different policies.  For example, perhaps one channel with OrgA, OrgB, 
and OrgC could require all three organizations to endorse a transaction proposal, but another channel with OrgA, OrgB and OrgC could 
require just two, or even just one, of the three organizations to endorse a transaction proposal.

The decision on how many channels to create and what policies they have will usually be driven by the requirements of the particular 
business problem being solved.

**Step 1:**	Access the *cli* Docker container::

 bcuser@ubuntu-bc:~/zmarbles$ docker exec -it cli bash
 root@fbe81505b8a2:/opt/gopath/src/github.com/hyperledger/fabric/peer#

Observe that your command prompt changes when you enter the Docker container’s shell.

The *docker exec* command runs a command against an existing Docker container.  The *-it* flags basically work together to say, 
“we want an interactive terminal session with this Docker container”.  *cli* is the name of the Docker container (this came from the 
*container_name* statement in the *docker-compose.yaml* file for the *cli* service).  *bash* is the name of the command you want to 
enter.   In other words, you are entering a Bash shell within the *cli* Docker container.  For most of the rest of the lab, you will be 
entering commands within this Bash shell.

Instead of working as user *bcuser* on the ubuntu-bc server in the *~/zmarbles* directory, you are now inside the Docker container with 
ID *fbe81505b8a2* (your ID will differ), working in the */opt/gopath/src/github.com/hyperledger/fabric/peer* directory.  It is no 
coincidence that that directory is the value of the *working_dir* statement for the *cli* service in your *docker-compose.yaml* file.

**Step 2:** Read on to learn about a convenience script to point to a particular peer from the *cli* Docker container. A convenience 
script named *setpeer* is provided within the *cli* container that is in the *scripts* subdirectory of your current working directory. 
This script will set the environment variables to the values necessary to point to a particular peer.   The script takes two 
arguments.  This first argument is either 0 or 1 for Organization 0 or Organization 1 respectively, and the second argument is for 
either Peer 0 or Peer 1 of the organization selected by the first argument.   Therefore, throughout the remainder of this lab, before
sending commands to a peer, you will enter one of the following four valid combinations, depending on which peer you want to run the 
command on:

*source scripts/setpeer 0 0*   # to target Org 0, peer 0  (peer0.unitedmarbles.com)

*source scripts/setpeer 0 1*   # to target Org 0, peer 1  (peer1.united marbles.com)

*source scripts/setpeer 1 0*   # to target Org 1, peer 0  (peer0.marblesinc.com)

*source scripts/setpeer 1 1*   # to target Org 1, peer 1  (peer1.marblesinc.com)

**Step 3:** Choose your favorite peer and use one of the four *source scripts/setpeer* commands listed in the prior step.   Although 
you are going to join all four peers to our channel, you only need to issue the channel creation command once.  You can issue it from 
any of the four peers, so pick your favorite peer and issue the source command.  In this screen snippet, I have chosen Org 1, peer 1::

 root@fbe81505b8a2:/opt/gopath/src/github.com/hyperledger/fabric/peer# source scripts/setpeer 1 1
 CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/marblesinc.com/peers/peer1.marblesinc.com/tls/ca.crt
 CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/peers/peer0.unitedmarbles.com/tls/server.key
 CORE_PEER_LOCALMSPID=Org1MSP
 CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
 CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/peers/peer0.unitedmarbles.com/tls/server.crt
 CORE_PEER_TLS_ENABLED=true
 CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/marblesinc.com/users/Admin@marblesinc.com/msp
 CORE_PEER_ID=cli
 CORE_LOGGING_LEVEL=DEBUG
 CORE_PEER_ADDRESS=peer1.marblesinc.com:7051
 root@fbe81505b8a2:/opt/gopath/src/github.com/hyperledger/fabric/peer#

The last environment variable listed, *CORE_PEER_ADDRESS*, determines to which peer your commands will be routed.  

**Step 4:**	The Hyperledger Fabric network is configured to require TLS, so when you enter your peer commands, you need to add a 
flag that indicates TLS is enabled, and you need to add an argument that points to the root signer certificate of the certificate 
authority for the orderer service.

What you are going to do next is set an environment variable that will specify these arguments for you, and that way you will not 
have to type out the hideously long path for the CA’s root signer certificate every time. Enter this command exactly as shown::

 root@fbe81505b8a2:/opt/gopath/src/github.com/hyperledger/fabric/peer# export FABRIC_TLS="--tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/blockchain.com/orderers/orderer.blockchain.com/msp/tlscacerts/tlsca.blockchain.com-cert.pem"

**Note:** This above is intended to be entered without any line breaks-  if you are cutting and pasting this, depending on the medium 
you are using, line breaks may have been introduced.  There only needs to be one space between the **--cafile** and the long path name 
to the CA certificate file.  I apologize for the complexity of this command, but once you get it right, you won’t have to hassle with 
it again as long as you do not exit the cli Docker container’s bash shell.

**Step 5:**	Verify that you entered the FABRIC_TLS environment variable correctly.  (Note that when setting, or exporting, the variable 
you did not prefix the variable with a “$”, but when referencing it you do prefix it with a “$”.   Your output should look like this::

 root@fbe81505b8a2:/opt/gopath/src/github.com/hyperledger/fabric/peer# echo $FABRIC_TLS 
 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/blockchain.com/orderers/orderer.blockchain.com/msp/cacerts/ca.blockchain.com-cert.pem

**Step 6:** Now enter this command::

 root@fbe81505b8a2:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer channel create -o orderer.blockchain.com:7050  -f channel-artifacts/channel.tx  $FABRIC_TLS -c mychannel
 
If this goes well, after a few seconds, you are going to see a whole bunch of gibberish and then the last line before you get 
your command prompt back will end with the reassuring phrase, “Exiting…..”.   Here is a screen snippet that shows the end of the output, and I have included several lines of gibberish so you can feel good if your gibberish looks like my gibberish.  Trust me, it is working as coded!
::

 2017-06-18 23:14:19.197 UTC [channelCmd] readBlock -> DEBU 019 Got status:*orderer.DeliverResponse_Status 
 2017-06-18 23:14:19.197 UTC [msp] GetLocalMSP -> DEBU 01a Returning existing local MSP
 2017-06-18 23:14:19.197 UTC [msp] GetDefaultSigningIdentity -> DEBU 01b Obtaining default signing identity
 2017-06-18 23:14:19.199 UTC [channelCmd] InitCmdFactory -> INFO 01c Endorser and orderer connections initialized
 2017-06-18 23:14:19.399 UTC [msp] GetLocalMSP -> DEBU 01d Returning existing local MSP
 2017-06-18 23:14:19.399 UTC [msp] GetDefaultSigningIdentity -> DEBU 01e Obtaining default signing identity
 2017-06-18 23:14:19.399 UTC [msp] GetLocalMSP -> DEBU 01f Returning existing local MSP
 2017-06-18 23:14:19.399 UTC [msp] GetDefaultSigningIdentity -> DEBU 020 Obtaining default signing identity
 2017-06-18 23:14:19.399 UTC [msp/identity] Sign -> DEBU 021 Sign: plaintext: 0AE3060A1508021A0608CB929CCA0522...412A4B6FE11512080A021A0012021A00 
 2017-06-18 23:14:19.399 UTC [msp/identity] Sign -> DEBU 022 Sign: digest: D729BF530976D59B9E03D75121F00AD0F6B153A774746D45C41B51BEB7DB7D0E 2017-06-18 23:14:19.402 UTC [channelCmd] readBlock -> DEBU 023 Received block:0 
 2017-06-18 23:14:19.402 UTC [main] main -> INFO 024 Exiting.....

Proceed to the next section where you will join each peer to the channel.
 
Section 6	- Instruct each peer node to join the channel
=======================================================

In the last section, you issued the *peer channel create* command from one of the peers.   Now any peer that you want to join the 
channel may join- you will issue the *peer channel join* command from each peer.

For a peer to be eligible to join a channel, it must be a member of an organization that is authorized to join the channel.  When you 
created your channel, you authorized *Org0MSP* and *Org1MSP* to join the channel.  Each of your four peers belongs to one of those two 
organizations- two peers for each one- so they will be able to join successfully.   If someone from an organization other than *Org0MSP* 
or *Org1MSP* attempted to join their peers to this channel, the attempt would fail.

You are going to repeat the following steps for each of the four peer nodes, in order to show that the peer successfully joined the 
channel:

1.	Use the *scripts/setpeer* script to point the CLI to the peer

2.	Use the *peer channel list* command to show that the peer is not joined to any channels

3.	Use the *peer channel join* command to join the peer to your channel

4.	Use the *peer channel list* command again to see that the peer has joined your channel

**Step 1:**	Point the *cli* to *peer0* for *Org0MSP*::

 root@866fe10bfea1:/opt/gopath/src/github.com/hyperledger/fabric/peer# source scripts/setpeer 0 0
 CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/peers/peer0.unitedmarbles.com/tls/ca.crt
 CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/peers/peer0.unitedmarbles.com/tls/server.key
 CORE_PEER_LOCALMSPID=Org0MSP
 CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
 CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/peers/peer0.unitedmarbles.com/tls/server.crt
 CORE_PEER_TLS_ENABLED=true
 CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/users/Admin@unitedmarbles.com/msp
 CORE_PEER_ID=cli
 CORE_LOGGING_LEVEL=DEBUG
 CORE_PEER_ADDRESS=peer0.unitedmarbles.com:7051

**Step 2:** Enter *peer channel list* and observe that no channels are returned at the end of the output::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer channel list
 2017-07-11 18:56:22.925 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 18:56:22.925 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 18:56:22.928 UTC [channelCmd] InitCmdFactory -> INFO 006 Endorser and orderer connections initialized
 2017-07-11 18:56:22.928 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AAA070A5C08031A0C08D6BE94CB0510...631A0D0A0B4765744368616E6E656C73 
 2017-07-11 18:56:22.928 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: 86A97AF3B9B97F0B27B4043830C8802D583293D9E723AB039588C4E03F261521 
 2017-07-11 18:56:22.931 UTC [channelCmd] list -> INFO 009 Channels peers has joined to: 
 2017-07-11 18:56:22.931 UTC [main] main -> INFO 00a Exiting.....

**Step 3:** Issue *peer channel join -b mychannel.block* to join channel *mychannel*.  If you gave your channel a name other than 
*mychannel*, then change *mychannel* to the name of your channel.  If you are still on the happy path, your output will look similar to 
this::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer channel join -b mychannel.block 
 2017-07-11 18:58:54.252 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 18:58:54.252 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 18:58:54.254 UTC [channelCmd] InitCmdFactory -> INFO 006 Endorser and orderer connections initialized
 2017-07-11 18:58:54.254 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AA9070A5B08011A0B08EEBF94CB0510...999A2A13AB5A1A080A000A000A000A00 
 2017-07-11 18:58:54.254 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: 60ACC3EBD0EFE06F18420C583756E0521D036C7DB53145766DD27C33108BFBE3 
 2017-07-11 18:58:54.303 UTC [channelCmd] executeJoin -> INFO 009 Peer joined the channel!
 2017-07-11 18:58:54.303 UTC [main] main -> INFO 00a Exiting.....
 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer#

**Step 4:**	Repeat the *peer channel list* command and now you should see your channel listed in the output::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer channel list
 2017-07-11 19:00:38.435 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 19:00:38.435 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 19:00:38.437 UTC [channelCmd] InitCmdFactory -> INFO 006 Endorser and orderer connections initialized
 2017-07-11 19:00:38.437 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AAA070A5C08031A0C08D6C094CB0510...631A0D0A0B4765744368616E6E656C73 
 2017-07-11 19:00:38.437 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: C3E15938B003ADE8279D463B4138A003961F5C35B9F40ECC0D2BE5C3914C528E 
 2017-07-11 19:00:38.440 UTC [channelCmd] list -> INFO 009 Channels peers has joined to: 
 2017-07-11 19:00:38.440 UTC [channelCmd] list -> INFO 00a mychannel 
 2017-07-11 19:00:38.440 UTC [main] main -> INFO 00b Exiting.....

**Step 5:**	Point the *cli* to *peer1* for *Org0MSP*::

 root@866fe10bfea1:/opt/gopath/src/github.com/hyperledger/fabric/peer# source scripts/setpeer 0 1
 CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/peers/peer1.unitedmarbles.com/tls/ca.crt
 CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/peers/peer0.unitedmarbles.com/tls/server.key
 CORE_PEER_LOCALMSPID=Org0MSP
 CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
 CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/peers/peer0.unitedmarbles.com/tls/server.crt
 CORE_PEER_TLS_ENABLED=true
 CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/users/Admin@unitedmarbles.com/msp
 CORE_PEER_ID=cli
 CORE_LOGGING_LEVEL=DEBUG
 CORE_PEER_ADDRESS=peer1.unitedmarbles.com:7051

**Step 6:** Enter *peer channel list* and observe that no channels are returned at the end of the output::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer channel list
 2017-07-11 18:56:22.925 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 18:56:22.925 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 18:56:22.928 UTC [channelCmd] InitCmdFactory -> INFO 006 Endorser and orderer connections initialized
 2017-07-11 18:56:22.928 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AAA070A5C08031A0C08D6BE94CB0510...631A0D0A0B4765744368616E6E656C73 
 2017-07-11 18:56:22.928 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: 86A97AF3B9B97F0B27B4043830C8802D583293D9E723AB039588C4E03F261521 
 2017-07-11 18:56:22.931 UTC [channelCmd] list -> INFO 009 Channels peers has joined to: 
 2017-07-11 18:56:22.931 UTC [main] main -> INFO 00a Exiting.....

**Step 7:**	Issue *peer channel join -b mychannel.block* to join channel *mychannel*.  If you gave your channel a name other 
than *mychannel*, then change *mychannel* to the name of your channel.  If you are still on the happy path, your output will look 
similar to this::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer channel join -b mychannel.block 
 2017-07-11 18:58:54.252 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 18:58:54.252 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 18:58:54.254 UTC [channelCmd] InitCmdFactory -> INFO 006 Endorser and orderer connections initialized
 2017-07-11 18:58:54.254 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AA9070A5B08011A0B08EEBF94CB0510...999A2A13AB5A1A080A000A000A000A00 
 2017-07-11 18:58:54.254 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: 60ACC3EBD0EFE06F18420C583756E0521D036C7DB53145766DD27C33108BFBE3 
 2017-07-11 18:58:54.303 UTC [channelCmd] executeJoin -> INFO 009 Peer joined the channel!
 2017-07-11 18:58:54.303 UTC [main] main -> INFO 00a Exiting.....
 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer#

**Step 8:** Repeat the *peer channel list* command and now you should see your channel listed::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer channel list
 2017-07-11 19:00:38.435 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 19:00:38.435 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 19:00:38.437 UTC [channelCmd] InitCmdFactory -> INFO 006 Endorser and orderer connections initialized
 2017-07-11 19:00:38.437 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AAA070A5C08031A0C08D6C094CB0510...631A0D0A0B4765744368616E6E656C73 
 2017-07-11 19:00:38.437 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: C3E15938B003ADE8279D463B4138A003961F5C35B9F40ECC0D2BE5C3914C528E 
 2017-07-11 19:00:38.440 UTC [channelCmd] list -> INFO 009 Channels peers has joined to: 
 2017-07-11 19:00:38.440 UTC [channelCmd] list -> INFO 00a mychannel 
 2017-07-11 19:00:38.440 UTC [main] main -> INFO 00b Exiting.....

**Step 9:**	Point the *cli* to *peer0* for *Org1MSP*::

 root@866fe10bfea1:/opt/gopath/src/github.com/hyperledger/fabric/peer# source scripts/setpeer 1 0
 CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/marblesinc.com/peers/peer0.marblesinc.com/tls/ca.crt
 CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/peers/peer0.unitedmarbles.com/tls/server.key
 CORE_PEER_LOCALMSPID=Org1MSP
 CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
 CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/peers/peer0.unitedmarbles.com/tls/server.crt
 CORE_PEER_TLS_ENABLED=true
 CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/marblesinc.com/users/Admin@marblesinc.com/msp
 CORE_PEER_ID=cli
 CORE_LOGGING_LEVEL=DEBUG
 CORE_PEER_ADDRESS=peer0.marblesinc.com:7051

**Step 10:** Enter *peer channel list* and observe that no channels are returned at the end of the output::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer channel list
 2017-07-11 18:56:22.925 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 18:56:22.925 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 18:56:22.928 UTC [channelCmd] InitCmdFactory -> INFO 006 Endorser and orderer connections initialized
 2017-07-11 18:56:22.928 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AAA070A5C08031A0C08D6BE94CB0510...631A0D0A0B4765744368616E6E656C73 
 2017-07-11 18:56:22.928 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: 86A97AF3B9B97F0B27B4043830C8802D583293D9E723AB039588C4E03F261521 
 2017-07-11 18:56:22.931 UTC [channelCmd] list -> INFO 009 Channels peers has joined to: 
 2017-07-11 18:56:22.931 UTC [main] main -> INFO 00a Exiting.....

**Step 11:** Issue *peer channel join -b mychannel.block* to join channel *mychannel*.  If you gave your channel a name other 
than *mychannel*, then change *mychannel* to the name of your channel.  If you are still on the happy path, your output will look 
similar to this::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer channel join -b mychannel.block 
 2017-07-11 18:58:54.252 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 18:58:54.252 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 18:58:54.254 UTC [channelCmd] InitCmdFactory -> INFO 006 Endorser and orderer connections initialized
 2017-07-11 18:58:54.254 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AA9070A5B08011A0B08EEBF94CB0510...999A2A13AB5A1A080A000A000A000A00 
 2017-07-11 18:58:54.254 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: 60ACC3EBD0EFE06F18420C583756E0521D036C7DB53145766DD27C33108BFBE3 
 2017-07-11 18:58:54.303 UTC [channelCmd] executeJoin -> INFO 009 Peer joined the channel!
 2017-07-11 18:58:54.303 UTC [main] main -> INFO 00a Exiting.....
 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer#

**Step 12:** Repeat the *peer channel list* command and now you should see your channel listed in the output::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer channel list
 2017-07-11 19:00:38.435 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 19:00:38.435 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 19:00:38.437 UTC [channelCmd] InitCmdFactory -> INFO 006 Endorser and orderer connections initialized
 2017-07-11 19:00:38.437 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AAA070A5C08031A0C08D6C094CB0510...631A0D0A0B4765744368616E6E656C73 
 2017-07-11 19:00:38.437 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: C3E15938B003ADE8279D463B4138A003961F5C35B9F40ECC0D2BE5C3914C528E 
 2017-07-11 19:00:38.440 UTC [channelCmd] list -> INFO 009 Channels peers has joined to: 
 2017-07-11 19:00:38.440 UTC [channelCmd] list -> INFO 00a mychannel 
 2017-07-11 19:00:38.440 UTC [main] main -> INFO 00b Exiting.....

**Step 13:**	Point the *cli* to *peer1* for *Org1MSP*::

 root@866fe10bfea1:/opt/gopath/src/github.com/hyperledger/fabric/peer# source scripts/setpeer 1 1
 CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/marblesinc.com/peers/peer1.marblesinc.com/tls/ca.crt
 CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/peers/peer0.unitedmarbles.com/tls/server.key
 CORE_PEER_LOCALMSPID=Org1MSP
 CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
 CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/unitedmarbles.com/peers/peer0.unitedmarbles.com/tls/server.crt
 CORE_PEER_TLS_ENABLED=true
 CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/marblesinc.com/users/Admin@marblesinc.com/msp
 CORE_PEER_ID=cli
 CORE_LOGGING_LEVEL=DEBUG
 CORE_PEER_ADDRESS=peer1.marblesinc.com:7051

The output from this should be familiar to you by now so from now on I will not bother showing it anymore in the remainder of these 
lab instructions.

**Step 14:** Enter *peer channel list* and observe that no channels are returned at the end of the output::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer channel list
 2017-07-11 18:56:22.925 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 18:56:22.925 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 18:56:22.928 UTC [channelCmd] InitCmdFactory -> INFO 006 Endorser and orderer connections initialized
 2017-07-11 18:56:22.928 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AAA070A5C08031A0C08D6BE94CB0510...631A0D0A0B4765744368616E6E656C73 
 2017-07-11 18:56:22.928 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: 86A97AF3B9B97F0B27B4043830C8802D583293D9E723AB039588C4E03F261521 
 2017-07-11 18:56:22.931 UTC [channelCmd] list -> INFO 009 Channels peers has joined to: 
 2017-07-11 18:56:22.931 UTC [main] main -> INFO 00a Exiting.....

**Step 15:** Issue *peer channel join -b mychannel.block* to join channel *mychannel*.  If you gave your channel a name other 
than *mychannel*, then change *mychannel* to the name of your channel.  If you are still on the happy path, your output will look 
similar to this::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer channel join -b mychannel.block 
 2017-07-11 18:58:54.252 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 18:58:54.252 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 18:58:54.254 UTC [channelCmd] InitCmdFactory -> INFO 006 Endorser and orderer connections initialized
 2017-07-11 18:58:54.254 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AA9070A5B08011A0B08EEBF94CB0510...999A2A13AB5A1A080A000A000A000A00 
 2017-07-11 18:58:54.254 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: 60ACC3EBD0EFE06F18420C583756E0521D036C7DB53145766DD27C33108BFBE3 
 2017-07-11 18:58:54.303 UTC [channelCmd] executeJoin -> INFO 009 Peer joined the channel!
 2017-07-11 18:58:54.303 UTC [main] main -> INFO 00a Exiting.....
 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer#

**Step 16:**	Repeat the *peer channel list* command and now you should see your channel listed in the output::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer channel list
 2017-07-11 19:00:38.435 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 19:00:38.435 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 19:00:38.437 UTC [channelCmd] InitCmdFactory -> INFO 006 Endorser and orderer connections initialized
 2017-07-11 19:00:38.437 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AAA070A5C08031A0C08D6C094CB0510...631A0D0A0B4765744368616E6E656C73 
 2017-07-11 19:00:38.437 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: C3E15938B003ADE8279D463B4138A003961F5C35B9F40ECC0D2BE5C3914C528E 
 2017-07-11 19:00:38.440 UTC [channelCmd] list -> INFO 009 Channels peers has joined to: 
 2017-07-11 19:00:38.440 UTC [channelCmd] list -> INFO 00a mychannel 
 2017-07-11 19:00:38.440 UTC [main] main -> INFO 00b Exiting.....
 
Section 7	- Define an “anchor” peer for each organization in the channel
========================================================================
An anchor peer for an organization is a peer that is known by all the other organizations in a channel.  Not all peers for an 
organization need to be known by outside organizations.  Peers not defined as anchor peers are visible only within their own 
organization.

In a production environment, an organization will typically define more than one peer as an anchor peer for availability and 
resilience. In our lab, we will just define one of the two peers for each organization as an anchor peer.

The definition of an anchor peer took place back in section 4 when you ran the *generateArtifacts.sh* script.  Two of the output files 
from that step were *Org0MSPanchors.tx* and *Org1MSPanchors.tx.*  These are input files to define the anchor peers for Org0MSP and 
Org1MSP respectively.  After the channel is created, each organization needs to run this command.  You will do that now-  this process 
is a little bit confusing in that the command to do this starts with *peer channel create …* but the command will actually *update* the 
existing channel with the information about the desired anchor peer.  Think of *peer channel create* here as meaning, “create an update 
transaction for a channel”.

Issue the following commands which will define the two anchor peers::

 source scripts/setpeer 0 0   # to switch to Peer 0 for Org0MSP
 peer channel create -o orderer.blockchain.com:7050 -f channel-artifacts/Org0MSPanchors.tx $FABRIC_TLS -c mychannel   # change mychannel if you customized your channel name
 source scripts/setpeer 1 0   # to switch to Peer 0 for Org1MSP
 peer channel create -o orderer.blockchain.com:7050 -f channel-artifacts/Org1MSPanchors.tx $FABRIC_TLS -c mychannel   # change mychannel if you customized your channel name
 
Section 8	- Install the chaincode on the peer nodes
===================================================

Installing chaincode on the peer nodes puts the chaincode binary executable on a peer node. If you want the peer to be an endorser on a 
channel for a chaincode, then you must install the chaincode on that peer.  If you only want the peer to be a committer on a channel 
for a chaincode, then you do not have to install the chaincode on that peer.  In this section, you will install the chaincode on two of 
your peers.

**Step 1:** Enter ``source scripts/setpeer 0 0`` to switch to Peer0 in Org0MSP.

**Step 2:**	Install the marbles chaincode on Peer0 in Org0MSP. You are looking for a message near the end of the output similar to what 
is shown here::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer chaincode install -n marbles -v 1.0 -p github.com/hyperledger/fabric/examples/chaincode/go/marbles 
 2017-07-11 19:08:31.274 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 19:08:31.274 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 19:08:31.275 UTC [golang-platform] getCodeFromFS -> DEBU 006 getCodeFromFS github.com/hyperledger/fabric/examples/chaincode/go/marbles
 2017-07-11 19:08:31.345 UTC [golang-platform] func1 -> DEBU 007 Discarding GOROOT package bytes
 2017-07-11 19:08:31.345 UTC [golang-platform] func1 -> DEBU 008 Discarding GOROOT package encoding/json
 2017-07-11 19:08:31.345 UTC [golang-platform] func1 -> DEBU 009 Discarding GOROOT package errors
 2017-07-11 19:08:31.345 UTC [golang-platform] func1 -> DEBU 00a Discarding GOROOT package fmt
 2017-07-11 19:08:31.345 UTC [golang-platform] func1 -> DEBU 00b Discarding provided package github.com/hyperledger/fabric/core/chaincode/shim
 2017-07-11 19:08:31.345 UTC [golang-platform] func1 -> DEBU 00c Discarding provided package github.com/hyperledger/fabric/protos/peer
 2017-07-11 19:08:31.346 UTC [golang-platform] func1 -> DEBU 00d Discarding GOROOT package strconv
 2017-07-11 19:08:31.346 UTC [golang-platform] func1 -> DEBU 00e Discarding GOROOT package strings
 2017-07-11 19:08:31.346 UTC [golang-platform] func1 -> DEBU 00f Discarding GOROOT package 
 2017-07-11 19:08:31.346 UTC [golang-platform] GetDeploymentPayload -> DEBU 010 done
 2017-07-11 19:08:31.348 UTC [msp/identity] Sign -> DEBU 011 Sign: plaintext: 0AAA070A5C08031A0C08AFC494CB0510...E3E7FF070000FFFF4526F68D00800000 
 2017-07-11 19:08:31.348 UTC [msp/identity] Sign -> DEBU 012 Sign: digest: E889A960468495CE465393C69A1C379AA1BF0CEB02A380782670821B9295713B 
 2017-07-11 19:08:31.352 UTC [chaincodeCmd] install -> DEBU 013 Installed remotely response:<status:200 payload:"OK" > 
 2017-07-11 19:08:31.352 UTC [main] main -> INFO 014 Exiting.....

**Step 3:** Enter ``source scripts/setpeer 1 0`` to switch to Peer0 in Org1MSP.

**Step 4:** Enter 
::
 peer chaincode install -n marbles -v 1.0 -p github.com/hyperledger/fabric/examples/chaincode/go/marbles 

which will install the marbles chaincode on Peer0 in Org1MSP.  You should receive a message similar to what you received in step 2.

An interesting thing to note is that for the *peer chaincode install* command you did not need to specify the $FABRIC_TLS environment 
variable.  This is because this operation does not cause the peer to communicate with the orderer.

Installing chaincode on a peer is a necessary step, but not the only step needed, in order to execute chaincode on that peer.  The 
chaincode must also be instantiated on a channel that the peer participates in.  You will do that in the next section.
 
Section 9	- Instantiate the chaincode on the channel
====================================================

In the previous section, you installed chaincode on two of your four peers.  Chaincode installation is a peer-level operation.  
Chaincode instantiation, however, is a channel-level operation.  It only needs to be performed once on the channel, no matter how many 
peers have joined the channel.

Chaincode instantiation causes a transaction to occur on the channel, so even if a peer on the channel does not have the chaincode 
installed, it will be made aware of the instantiate transaction, and thus be aware that the chaincode exists and be able to commit 
transactions from the chaincode to the ledger-  it just would not be able to endorse a transaction on the chaincode.

**Step 1:**	You want to stay signed in to the *cli* Docker container, however, you will also want to issue some Docker commands from your 
Linux on IBM Z host, so at this time open up a second PuTTY session and sign in to your Linux on IBM Z host.   For the remainder of 
this lab, I will refer to the session where you are in the *cli* Docker container as *PuTTY Session 1*, and this new session where you 
are at the Linux on IBM Z host as *PuTTY Session 2*.

**Step 2:**.	You are going to confirm that you do not have any chaincode Docker images created, nor any Docker chaincode containers 
running currently, by issuing several Docker commands from PuTTY Session 2.

Enter ``docker images`` and observe that all of your images begin with *hyperledger*.  If your output screen is “too busy”, try 
entering ``docker images dev-*`` and you should see very little output except for some column headings.   This will show only those 
images that begin with *dev-\**, of which there should not be any at this point in the lab.

Now do essentially the same thing with *docker ps*.   Enter ``docker ps`` and you should see all of the Docker containers for the 
Hyperledger Fabric processes and CouchDB, but no chaincode-related Docker containers.  Entering ``docker ps | grep -v hyperledger`` will 
make this fact stand out more as you should only see column headers in your output. (The *-v* flag for grep says “do not show me 
anything that contains the string “hyperledger”).

Now that you have established that you have no chaincode-related Docker images or containers present, try to instantiate the chaincode.

**Step 3:**	On PuTTY Session 1, switch to Peer 0 of Org0MSP by entering ``source scripts/setpeer 0 0``

**Step 4:** On PuTTY Session 1, issue the command to instantiate the chaincode on the channel::

 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer chaincode instantiate -o orderer.blockchain.com:7050 -n marbles -v 1.0 -c '{"Args":["init","1"]}' -P "OR ('Org0MSP.member','Org1MSP.member')" $FABRIC_TLS -C mychannel
 2017-07-11 19:20:55.907 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
 2017-07-11 19:20:55.907 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
 2017-07-11 19:20:55.908 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 006 Using default escc
 2017-07-11 19:20:55.909 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 007 Using default vscc
 2017-07-11 19:20:55.909 UTC [msp/identity] Sign -> DEBU 008 Sign: plaintext: 0AB5070A6708031A0C0897CA94CB0510...314D53500A04657363630A0476736363
 2017-07-11 19:20:55.909 UTC [msp/identity] Sign -> DEBU 009 Sign: digest: 86EEF32422E05FEC0C7AB4FBBDA9E1405CFF7C88487A91097A84CA5D1B7F66CE
 2017-07-11 19:21:09.330 UTC [msp/identity] Sign -> DEBU 00a Sign: plaintext: 0AB5070A6708031A0C0897CA94CB0510...0248951F07CC056DF7D930D917AB7B03
 2017-07-11 19:21:09.331 UTC [msp/identity] Sign -> DEBU 00b Sign: digest: AE3E93DBAA4BA5CDD93596F3EE656006009F5F95CAFAD2CE2AECB4CFB60671BA
 2017-07-11 19:21:09.333 UTC [main] main -> INFO 00c Exiting.....
 root@0b784bcee1c7:/opt/gopath/src/github.com/hyperledger/fabric/peer#

**Note:**  In your prior commands, when specifying the channel name, you used lowercase ‘c’ as the argument, e.g., *-c mychannel*.  
In the *peer chaincode instantiate* command however, you use an uppercase ‘C’ as the argument to specify the channel name, e.g., 
*-C mychannel*, because -c is used to specify the arguments given to the chaincode.  Why *-c* for arguments you may ask?  Well, the ‘*c*’ 
is short for ‘*ctor*’, which itself is an abbreviation for constructor, which is a fancy word object-oriented programmers use to refer 
to the initial arguments given when creating an object.  Some people do not like being treated as objects, but evidently chaincode 
does not object to being objectified.

**Step 5:**	You may have noticed a longer than usual pause while this command was being run.  The reason for this is that as part of 
the instantiate, a Docker image for the chaincode is created and then a Docker container is started from the image.  To prove this to 
yourself, on PuTTY Session 2, enter *docker images dev-** and *docker ps | grep -v hyperledger* ::

 bcuser@ubuntu16042:~$ docker images dev-* 
 REPOSITORY                                TAG                 IMAGE ID            CREATED             SIZE
 dev-peer0.unitedmarbles.com-marbles-1.0   latest              e248dfa62e87        28 seconds ago      188 MB
 bcuser@ubuntu16042:~$ docker ps | grep -v hyperledger 
 CONTAINER ID        IMAGE                                     COMMAND                  CREATED             STATUS              PORTS                                              NAMES
 83cc13063a08        dev-peer0.unitedmarbles.com-marbles-1.0   "chaincode -peer.addr"   43 seconds ago      Up 41 seconds                                                          dev-peer0.unitedmarbles.com-marbles-1.0

The naming convention used by Hyperledger Fabric v1.0.1 for the Docker images it creates for chaincode is *HyperledgerFabricNetworkName-PeerName-ChaincodeName-ChaincodeVersion*. In our case of *dev-peer0.unitedmarbles.com-marbles-1.0*, the 
default name of a Hyperledger Fabric network is *dev*, and you did not change it.  *peer0.unitedmarbles.com* is the peer name of 
peer0 of Org0MSP, and you specified this via the CORE_PEER_ID environment variable in the Docker Compose YAML file. *marbles* is the 
name you gave this chaincode in the *-n* argument of the *peer chaincode install* command, and *1.0* is the version of the chaincode 
you used in the *-v* argument of the *peer chaincode install* command.

Note that a chaincode Docker container was only created for the peer on which you entered the *peer chaincode instantiate* command.  
Docker containers will not be created on the other peers until you run a *peer chaincode invoke* or *peer chaincode query* command on 
that peer.
 

Section 10 - Invoke chaincode functions
=======================================

You are now ready to invoke chaincode functions that will create, read, update and delete data in the ledger.

In this section, you will enter *scripts/setpeer* and *peer chaincode commands* in PuTTY session 1, while you will enter *docker ps* and 
*docker images* commands in PuTTY session 2.
 
**Step 1:** Switch to peer0 of Org0 by entering ``scripts/setpeer 0 0`` in PuTTY session 1.

**Step 2:**	You will use the marbles chaincode to create a new Marbles owner named John.  If you would like to use a different name 
than John, that is fine but there will be other places later where you will need to use your “custom” name instead of John.  I will let 
you know when that is necessary.  Enter this command in PuTTY session 1::

 peer chaincode invoke -n marbles -c '{"Args":["init_owner", "o0000000000001","John","Marbles Inc"]}' $FABRIC_TLS -C mychannel

You will see a lot of output that should end with the result of the invoke-  it is a little daunting but if you look carefully you should notice that much of what you 
input is shown in the results::

 2017-07-11 19:50:40.361 UTC [chaincodeCmd] chaincodeInvokeOrQuery -> DEBU 0c7 ESCC invoke result: version:1 response:<status:200 message:"OK" > payload:"\n $M\331\263x\243\010I\276\034\300\307i<\244}\200\267\305\300w\257\306\216\014\371\3536\262\354\322\014\022\300\001\n\250\001\022\027\n\004lscc\022\017\n\r\n\007marbles\022\002\010\003\022\214\001\n\007marbles\022\200\001\n\020\n\016o0000000000001\032l\n\016o0000000000001\032Z{\"docType\":\"marble_owner\",\"id\":\"o0000000000001\",\"username\":\"john\",\"company\":\"Marbles Inc\"}\032\003\010\310\001\"\016\022\007marbles\032\0031.0" endorsement:<endorser:"\n\007Org0MSP\022\335\006-----BEGIN -----\nMIICXjCCAgWgAwIBAgIRAIq3yBmBC4FUhB/kAVkGgmkwCgYIKoZIzj0EAwIwdTEL\nMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\ncmFuY2lzY28xGjAYBgNVBAoTEXVuaXRlZG1hcmJsZXMuY29tMR0wGwYDVQQDExRj\nYS51bml0ZWRtYXJibGVzLmNvbTAeFw0xNzA3MTExODQyNDRaFw0yNzA3MDkxODQy\nNDRaMFwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRYwFAYDVQQH\nEw1TYW4gRnJhbmNpc2NvMSAwHgYDVQQDExdwZWVyMC51bml0ZWRtYXJibGVzLmNv\nbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABPox/Y/vN7s2zk31NyWQgLz87hmu\nKEZyuHDFzUTqEbdAj9GRQFBUWxn+xYpyX7VnbPfRDsfSRDvDqe8RTliQPwujgY4w\ngYswDgYDVR0PAQH/BAQDAgWgMBMGA1UdJQQMMAoGCCsGAQUFBwMBMAwGA1UdEwEB\n/wQCMAAwKwYDVR0jBCQwIoAgwFoY7spVdc+yf6iUPhFaUK+H8vPrPZglZatm1BLY\nY7YwKQYDVR0RBCIwIIIXcGVlcjAudW5pdGVkbWFyYmxlcy5jb22CBXBlZXIwMAoG\nCCqGSM49BAMCA0cAMEQCIHz9ZhFwqWWyoyHtso8LJMJOGG7gvC2jo398ZkxtZ7lR\nAiAq2b+Cwd/ZRClfnSPpf0kYGLWer4Gz7o4yGU4Euw3gVA==\n-----END -----\n" signature:"0D\002 G\031\373\376\277\026\325@\323\022\003;wE\t\372 \331\263&\201\341\323\365}\204\363\376\340\017*\t\002 \037m\226\231\371\267\367\nq\232\034>\332\276o\3342\277\340\030\031i\275|\203\013>V{T[1" > 
 2017-07-11 19:50:40.361 UTC [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 0c8 Chaincode invoke successful. result: status:200 
 2017-07-11 19:50:40.361 UTC [main] main -> INFO 0c9 Exiting.....
 
**Step 3:**	Let’s deconstruct the arguments to the chaincode::

 {“Args”:[“init_owner”, “o0000000000001”, “John”, “Marbles Inc”]}
 
This is in JSON format.  JSON stands for JavaScript Object Notation, and is a very popular format for transmitting data in many 
languages, not just with JavaScript.  What is shown above is a single name/value pair.  The name is *Args* and the value is an array of 
four arguments.  (The square brackets “[“ and “]” specify an array in JSON).

**Note:** In the formal JSON definition the term ‘*name/value*’ is used, but many programmers will also use the term ‘*key/value*’ 
instead.  You can consider these two terms as synonymous.  (Many people use the phrase “the same” instead of the word “synonymous”).

The *Args* name specifies the arguments passed to the chaincode invocation.  There is an interface layer, also called a “shim”, that 
gains control before passing it along to user-written chaincode functions-  it expects this *Args* name/value pair.

The shim also expects the first array value to be the name of the user-written chaincode function that it will pass control to, and 
then all remaining array values are the arguments to pass, in order, to that user-written chaincode function.

So, in the command you just entered, the *init_owner* function is called, and it is passed three arguments, *o0000000000001*, *John*, 
and *Marbles Inc*. 

It is logic within the *init_owner* function that cause updates to the channel’s ledger- subject to the transaction flow in Hyperledger 
Fabric v1.0-  that is, chaincode execution causes proposed updates to the ledger, which are only committed at the end of the 
transaction flow if everything is validated properly.  But it all starts with function calls inside the chaincode functions that ask 
for ledger state to be created or updated.

**Step 4:**	Go to PuTTY session 2, and enter these two Docker commands and you will observe that you only have a Docker image and a 
Docker container for peer0 of Org0::

 bcuser@ubuntu16042:~/zmarbles$ docker images dev-*
 REPOSITORY                                TAG                 IMAGE ID            CREATED             SIZE
 dev-peer0.unitedmarbles.com-marbles-1.0   latest              e248dfa62e87        35 minutes ago      188 MB
 bcuser@ubuntu16042:~/zmarbles$ docker ps --no-trunc | grep dev-
 83cc13063a08c37cd36f43687f54592c4a4dde9a51335f4343bb6adb2017bb5e   dev-peer0.unitedmarbles.com-marbles-1.0   "chaincode -peer.address=peer0.unitedmarbles.com:7051"                                                                                                                                                                                                                36 minutes ago      Up 36 minutes                                                          dev-peer0.unitedmarbles.com-marbles-1.0

The takeaway is that the chaincode execution has only run on peer0 of Org0 so far, and this is also the peer on which you instantiated 
the chaincode, so the Docker image for the chaincode, and the corresponding Docker container based on the image, have been created for 
only this peer.  You will see soon that other peers will have their own chaincode Docker image and Docker container built the first 
time they are needed.

**Step 5:**	You created a marble owner in the previous step, now create a marble belonging to this owner.   Perform this from peer0 of 
Org1, so from PuTTY session 1, enter ``source scripts/setpeer 1 0`` and then enter::

 peer chaincode invoke -n marbles -c '{"Args":["init_marble","m0000000000001","blue","35","o0000000000001","Marbles Inc"]}' $FABRIC_TLS -C mychannel 

The end of the output should show a good result through all the confusion- again::

 2017-07-11 20:36:18.160 UTC [chaincodeCmd] chaincodeInvokeOrQuery -> DEBU 0c7 ESCC invoke result: version:1 response:<status:200 message:"OK" > payload:"\n z\237\223\204g\373]\217\306v\267P\367\256!9\217\204M\330F\340\244gg\354W\016\031\242q\262\022\270\002\n\240\002\022\027\n\004lscc\022\017\n\r\n\007marbles\022\002\010\003\022\204\002\n\007marbles\022\370\001\n\020\n\016m0000000000001\n\024\n\016o0000000000001\022\002\010\004\032\315\001\n\016m0000000000001\032\272\001{\n\t\t\"docType\":\"marble\", \n\t\t\"id\": \"m0000000000001\", \n\t\t\"color\": \"blue\", \n\t\t\"size\": 35, \n\t\t\"owner\": {\n\t\t\t\"id\": \"o0000000000001\", \n\t\t\t\"username\": \"john\", \n\t\t\t\"company\": \"Marbles Inc\"\n\t\t}\n\t}\032\003\010\310\001\"\016\022\007marbles\032\0031.0" endorsement:<endorser:"\n\007Org1MSP\022\315\006-----BEGIN -----\nMIICUzCCAfmgAwIBAgIRAPoyvcxk/ARhKTwQVr8aicgwCgYIKoZIzj0EAwIwbzEL\nMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\ncmFuY2lzY28xFzAVBgNVBAoTDm1hcmJsZXNpbmMuY29tMRowGAYDVQQDExFjYS5t\nYXJibGVzaW5jLmNvbTAeFw0xNzA3MTEyMDE4MTNaFw0yNzA3MDkyMDE4MTNaMFkx\nCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRYwFAYDVQQHEw1TYW4g\nRnJhbmNpc2NvMR0wGwYDVQQDExRwZWVyMC5tYXJibGVzaW5jLmNvbTBZMBMGByqG\nSM49AgEGCCqGSM49AwEHA0IABGYtGf9GXe1yqms+AoE/Nt0uSqETQ+US9CIx18+i\nCYKul07ZxVrCH4KLGql/SqHjursaPzb8nbMzF9zEtYoycAGjgYswgYgwDgYDVR0P\nAQH/BAQDAgWgMBMGA1UdJQQMMAoGCCsGAQUFBwMBMAwGA1UdEwEB/wQCMAAwKwYD\nVR0jBCQwIoAgB5V0mkdvattfOcQYRphJXi0ZCMqoi0YtxvOIgVyKooUwJgYDVR0R\nBB8wHYIUcGVlcjAubWFyYmxlc2luYy5jb22CBXBlZXIwMAoGCCqGSM49BAMCA0gA\nMEUCIQDJEEA0YUm4nBrBjGF28aCljy3SYK2P/xfVZ/jnMtHRVwIgZTYuvXZOX+mF\n3ydQYTyxwnuvtFJE7ZkJppd/YsF6OEI=\n-----END -----\n" signature:"0D\002 \002\003\255]\274\r2\276\355\347<\372\002\006\260\021\210\202\313-\363\037\3000\"\n\325\331\002\026\354\362\002 W\364\361\023g\252\337\024e\020\003\013\260\373/\240\265 ;#\010wk/\216]{t\272\260\236}" > 
 2017-07-11 20:36:18.160 UTC [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 0c8 Chaincode invoke successful. result: status:200 
 2017-07-11 20:36:18.160 UTC [main] main -> INFO 0c9 Exiting.....

This time you called the *init_marble* function.  Now you have created one owner, and one marble.

The owner is *John* (or your custom name) and his id is *o0000000000001*, and his marble has an id of *m0000000000001*.  I cleverly 
decided that the letter ‘*o*’ stands for owner and the letter ‘*m*’ stands for marbles.  I put 12 leading zeros in front of the number 
1 in case you wanted to stay late and create trillions of marbles and owners.

**Step 6:**	In PuTTY session 2, repeat the Docker commands from step 4.  Now you should see that you have two Docker images and two 
Docker containers::

 bcuser@ubuntu16042:~/zmarbles$ docker images dev-*
 REPOSITORY                                TAG                 IMAGE ID            CREATED             SIZE
 dev-peer0.marblesinc.com-marbles-1.0      latest              10ec1ebd6d0b        9 minutes ago       188 MB
 dev-peer0.unitedmarbles.com-marbles-1.0   latest              30d3f553d454        10 minutes ago      188 MB
 bcuser@ubuntu16042:~/zmarbles$ docker ps --no-trunc | grep dev-
 7dc36ab249021c6af44a714a0809d62f1ef30af370181c375d3bae42d6000612   dev-peer0.marblesinc.com-marbles-1.0      "chaincode -peer.address=peer0.marblesinc.com:7051"                                                                                                                                                                                                                   9 minutes ago       Up 9 minutes                                                           dev-peer0.marblesinc.com-marbles-1.0
 4d0b5c9a18a9864d35304fced94f8235483ed7ea5209674a425253a13100137a   dev-peer0.unitedmarbles.com-marbles-1.0   "chaincode -peer.address=peer0.unitedmarbles.com:7051"                                                                                                                                                                                                                10 minutes ago      Up 10 minutes                                                          dev-peer0.unitedmarbles.com-marbles-1.0

**Step 7:**	You will create a new owner now.  Try that on Peer 1 of Org0, so enter ``source scripts/setpeer 0 1`` in PuTTY session 1 
and then try the command::

 peer chaincode invoke -n marbles -c '{"Args":["init_owner","o0000000000002","Barry","United Marbles"]}' $FABRIC_TLS -C mychannel

What do you expect to happen when you enter this command?

Well, I don’t expect you to know for sure, but what I expect, if you have followed these instructions exactly, is that the *invoke* will 
fail.  It will fail because you have not yet installed the chaincode on Peer 1 of Org0.  Here is the relevant portion of the output 
describing the error::

 Error: Error endorsing invoke: rpc error: code = Unknown desc = Chaincode data for cc marbles/1.0 was not found, error cannot retrieve package for chaincode marbles/1.0, error open /var/hyperledger/production/chaincodes/marbles.1.0: no such file or directory - <nil>

You must first *install* chaincode on a peer not only before you can do an *instantiate* from that peer, but also before you can do 
an *invoke* or *query* from that peer.  If you want a peer to perform the endorsing function for a transaction, the chaincode for 
that transaction must be installed on that peer.  If that peer is a member of the channel on which the chaincode is instantiated, but 
has not had the chaincode installed on it, it will still perform the committer function and update its copy of the channel’s ledger 
when it receives valid transactions from the orderer, but it cannot endorse transaction proposals unless the chaincode has been 
installed on it.

**Step 8**:	Correct things by installing the chaincode on peer1 of Org0.  In PuTTY session 1, enter this command, which should 
look familiar to you::

 peer chaincode install -n marbles -v1.0 -p github.com/hyperledger/fabric/examples/chaincode/go/marbles

And since familiarity breeds contempt, I will not show the complete output but you should see a message near the bottom that reads
*Installed remotely response: <status:200 payload:”OK” >*

**Step 9:**	Now, in PuTTY session 1, repeat the *peer chaincode invoke* command from step 7.  It should work this time::

 peer chaincode invoke -n marbles -c '{"Args":["init_owner","o0000000000002","Barry","United Marbles"]}' $FABRIC_TLS -C mychannel

The output format will be like what you have seen before, and you should be able to dig out some of the more human-readable pieces of 
it and assure yourself that this command succeeded.

**Step 10:**	Go back to PuTTY session 2 and enter the Docker commands that will show you that you now have your third pair in your 
set of chaincode-related Docker images and containers, the ones just built for peer1 of Org0::

 bcuser@ubuntu16042:~/zmarbles$ docker images dev-*
 REPOSITORY                                TAG                 IMAGE ID            CREATED              SIZE
 dev-peer1.unitedmarbles.com-marbles-1.0   latest              e618fe234503        About a minute ago   188 MB
 dev-peer0.marblesinc.com-marbles-1.0      latest              10ec1ebd6d0b        32 minutes ago       188 MB
 dev-peer0.unitedmarbles.com-marbles-1.0   latest              30d3f553d454        33 minutes ago       188 MB
 bcuser@ubuntu16042:~/zmarbles$ docker ps --no-trunc | grep dev-          
 dce42a9113afe6607e1f99ec236e04208b792d7a86ba2d67f04e70e4ef48a729   dev-peer1.unitedmarbles.com-marbles-1.0   "chaincode -peer.address=peer1.unitedmarbles.com:7051"                                                                                                                                                                                                                About a minute ago   Up About a minute                                                      dev-peer1.unitedmarbles.com-marbles-1.0
 7dc36ab249021c6af44a714a0809d62f1ef30af370181c375d3bae42d6000612   dev-peer0.marblesinc.com-marbles-1.0      "chaincode -peer.address=peer0.marblesinc.com:7051"                                                                                                                                                                                                                   33 minutes ago       Up 33 minutes                                                          dev-peer0.marblesinc.com-marbles-1.0
 4d0b5c9a18a9864d35304fced94f8235483ed7ea5209674a425253a13100137a   dev-peer0.unitedmarbles.com-marbles-1.0   "chaincode -peer.address=peer0.unitedmarbles.com:7051"                                                                                                                                                                                                                34 minutes ago       Up 34 minutes                                                          dev-peer0.unitedmarbles.com-marbles-1.0

**Step 11:**	Try some additional chaincode invocations. You have had enough experience switching between peers with  *source 
scripts/setpeer* and issuing the *peer chaincode invoke* command that I will not show the output, nor tell you from which peer you 
should enter your command.   I will just list several more commands you can run against the marbles chaincode. Feel free to switch 
amongst the four peers as you see fit before you enter each command.  Note however, that you have only installed the chaincode on 
three of the four peers, so if you choose that fourth peer, you will need to install the chaincode there first.   
I won’t tell you which peer does not currently have the chaincode installed, but if you need a hint, it is the one that does not 
have a Docker image built yet for its chaincode.  (Note that checking for the absence of a Docker image for a peer is not, by itself,
proof that you have not installed the chaincode on that peer- the Docker image is not built until you first invoke a function against 
the chaincode on that peer).

If you are ambitious and want to install the chaincode on that fourth peer, 
try the useful Docker commands I have shown you from PuTTY session 2 to see that the chaincode's Docker image and Docker container
are created when you invoke a transaction on that fourth peer.

Try some or all of these commands from PuTTY session 1:

Create a marble for Barry, i.e., owner o0000000000002::

 peer chaincode invoke -n marbles -c '{"Args":["init_marble","m0000000000002","green","50","o0000000000002","United Marbles"]}' $FABRIC_TLS -C mychannel

Obtain all marble information-  marbles and owners::

 peer chaincode invoke -n marbles -c '{"Args":["read_everything"]}' $FABRIC_TLS -C mychannel

Change marble ownership-  ‘Barry’ is giving his marble to ‘John’::

 peer chaincode invoke -n marbles -c '{"Args":["set_owner","m0000000000002","o0000000000001","United Marbles"]}' $FABRIC_TLS -C mychannel

Get the history of marble ‘m0000000000002’::

 peer chaincode invoke -n marbles -c '{"Args":["getHistory","m0000000000002"]}' $FABRIC_TLS -C mychannel

Delete marble ‘m0000000000002’::

 peer chaincode invoke -n marbles -c '{"Args":["delete_marble","m0000000000002","Marbles Inc"]}' $FABRIC_TLS -C mychannel

Try again to get the history of marble ‘m0000000000002’ after you just deleted it::

 peer chaincode invoke -n marbles -c '{"Args":["getHistory","m0000000000002"]}' $FABRIC_TLS -C mychannel

Obtain all marble information again.  See if it matches your expectations based on the commands you have entered::

 peer chaincode invoke -n marbles -c '{"Args":["read_everything"]}' $FABRIC_TLS -C mychannel
 
**Step 12:** Exit the *cli* Docker container from PuTTY session 1.  Your command prompt should change to reflect that you are now 
back at your Linux on z Systems host prompt and no longer in the Docker container::

 root@f97fefdbf4ff:/opt/gopath/src/github.com/hyperledger/fabric/peer# exit
 exit
 bcuser@ubuntu16042:~/zmarbles$

**Step 13:**	Congratulations!! Congratulations on your fortitude and perseverance.  Leave your Hyperledger Fabric network and all 
the chaincode Docker containers up and running-  you will use what you created here in the next lab where you will install a 
front-end Web application that will interact with the marbles chaincode that you have installed in this lab.


