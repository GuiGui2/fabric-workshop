## Chaincode Development

Section 1: Lab overview
=======================

In this lab, we will start by exploring the environment to gure out how the machine has been set up for the labs.
We will then create a small "Hello World" chaincode, debug, instantiate and test it.

Section 2: Getting started
==========================

**Step 1:** Log in to your assigned Ubuntu 17.04 Linux on IBM Z instance using PuTTY, the OS X terminal, or the Linux terminal of your choice.
You will be greated with a message similar to this one::

    [guigui@t460 ~]$ ssh blockchain@10.3.4.189
    blockchain@10.3.4.189's password: 
    Welcome to Ubuntu 17.04 (GNU/Linux 4.10.0-37-generic s390x)

     * Documentation:  https://help.ubuntu.com
     * Management:     https://landscape.canonical.com
     * Support:        https://ubuntu.com/advantage

     * CVE-2017-14106 (divide-by-zero vulnerability in the Linux TCP stack) is
       now fixed in Ubuntu.  Livepatch now, reboot later.
       - https://ubu.one/CVE-2017-14106
       - https://ubu.one/rebootLater

    1 package can be updated.
    0 updates are security updates.


    Last login: Tue Oct 17 15:56:34 2017 from 10.32.16.190
    blockchain@blkchn32:~$ 

**Step 2:** Explore the environment to find out where the go binaries are installed::

    blockchain@blkchn32:~$ which go 
    /usr/lib/go-1.8/bin/go

**Step 3:** Confirm what the exact version of the Go language installed on the machine::

    blockchain@blkchn32:~$ go version
    go version go1.8.1 linux/s390x

We have a Go version 1.8.1 version available for the s390x platform.

**Step4:** Chaincodes need to be installed in a subdirectory of the ${GOPATH}/src directory.
Using go env command, let's figure out what the value of this variable in order to identify where we need to locate our chaincode::

    blockchain@blkchn32:~$ go env GOPATH
    /home/blockchain/gopath

Our chaincode will have to go in a subdirectory of */home/blockchain/gopath/src*

Section 2: Getting the environment ready
========================================

**Step 1:** Move to the labconfig directory in your home folder. This directory contains all needed configuration files to start a Fabric.

    blockchain@blkchn32:~$ cd labconfig
    blockchain@blkchn30:~/labconfig$ ls
    api-node-js  configtx.yaml  cryptography  docker-compose-couchdb-lab.yaml  docker-compose-lab.yaml  labchannel.block  labchannel.tx  orderer.block

**Step 2:** Start the Fabric using the provided docker-compose file:

    blockchain@blkchn30:~/labconfig$ docker-compose -f docker-compose-couchdb-lab.yaml up -d
    Creating network "marbles_default" with the default driver
    Creating couchdb1
    Creating couchdb0
    Creating orderer0
    Creating peer0
    Creating peer1
    Creating cli

**Step 4:** Ensure the containers have been started as expected using the docker ps command:

    blockchain@blkchn30:~/labconfig$ docker ps
    CONTAINER ID        IMAGE                        COMMAND                  CREATED              STATUS              PORTS                                             NAMES
    2a4e82bd679e        hyperledger/fabric-tools     "/bin/bash -c 'sle..."   About a minute ago   Up About a minute   0.0.0.0:32771->9092/tcp                           cli
    ae3a77871a6f        hyperledger/fabric-peer      "peer node start"        About a minute ago   Up About a minute   7050/tcp, 7052-7059/tcp, 0.0.0.0:8051->7051/tcp   peer1
    f39027a7dcc9        hyperledger/fabric-peer      "peer node start"        About a minute ago   Up About a minute   7050/tcp, 7052-7059/tcp, 0.0.0.0:7051->7051/tcp   peer0
    c1560e815965        hyperledger/fabric-orderer   "orderer"                About a minute ago   Up About a minute   0.0.0.0:7050->7050/tcp                            orderer0
    a8c21e24d142        hyperledger/fabric-couchdb   "tini -- /docker-e..."   About a minute ago   Up About a minute   4369/tcp, 9100/tcp, 0.0.0.0:5984->5984/tcp        couchdb0
    85f226d3050d        hyperledger/fabric-couchdb   "tini -- /docker-e..."   About a minute ago   Up About a minute   4369/tcp, 9100/tcp, 0.0.0.0:6984->5984/tcp        couchdb1

The Fabric is composed of one orderer, 2 peers using CouchDB as their World State and a CLI we'll use in the next section to test our Smart Contract.

**Step 5:** For the Fabric to be usable, we need to create a channel, and add the two peers to this channel. We have provided 2 scripts to do that quickly.
First, we create a channel called labchannel, using the script called createLabChannel.sh.

    blockchain@blkchn30:~$ createLabChannel.sh 
    2017-10-23 08:06:18.640 UTC [msp] GetLocalMSP -> DEBU 001 Returning existing local MSP
    2017-10-23 08:06:18.640 UTC [msp] GetDefaultSigningIdentity -> DEBU 002 Obtaining default signing identity
    2017-10-23 08:06:18.661 UTC [channelCmd] InitCmdFactory -> INFO 003 Endorser and orderer connections initialized
    2017-10-23 08:06:18.661 UTC [msp] GetLocalMSP -> DEBU 004 Returning existing local MSP
    2017-10-23 08:06:18.661 UTC [msp] GetDefaultSigningIdentity -> DEBU 005 Obtaining default signing identity
    2017-10-23 08:06:18.661 UTC [msp] GetLocalMSP -> DEBU 006 Returning existing local MSP
    2017-10-23 08:06:18.661 UTC [msp] GetDefaultSigningIdentity -> DEBU 007 Obtaining default signing identity
    2017-10-23 08:06:18.661 UTC [msp/identity] Sign -> DEBU 008 Sign: plaintext: 0AE6060A10426C6F636B436861696E43...53616D706C65436F6E736F727469756D 
    2017-10-23 08:06:18.661 UTC [msp/identity] Sign -> DEBU 009 Sign: digest: 25A066C5B5B2309A805DB7E2D98826D277ED7C8D47D5C3938E6AB417BCACF635 
    2017-10-23 08:06:18.662 UTC [msp] GetLocalMSP -> DEBU 00a Returning existing local MSP
    2017-10-23 08:06:18.662 UTC [msp] GetDefaultSigningIdentity -> DEBU 00b Obtaining default signing identity
    2017-10-23 08:06:18.662 UTC [msp] GetLocalMSP -> DEBU 00c Returning existing local MSP
    2017-10-23 08:06:18.662 UTC [msp] GetDefaultSigningIdentity -> DEBU 00d Obtaining default signing identity
    2017-10-23 08:06:18.662 UTC [msp/identity] Sign -> DEBU 00e Sign: plaintext: 0A9E070A1608021A0608FAC5B6CF0522...0FC8970F145F512150D5A1BCA86CA755 
    2017-10-23 08:06:18.662 UTC [msp/identity] Sign -> DEBU 00f Sign: digest: F9F063E29589B5DA8A5C60CD27E6EC52B61E9C1B8F807AC3C2B61B183A70B752 
    2017-10-23 08:06:18.714 UTC [msp] GetLocalMSP -> DEBU 010 Returning existing local MSP
    2017-10-23 08:06:18.715 UTC [msp] GetDefaultSigningIdentity -> DEBU 011 Obtaining default signing identity
    2017-10-23 08:06:18.715 UTC [msp] GetLocalMSP -> DEBU 012 Returning existing local MSP
    2017-10-23 08:06:18.715 UTC [msp] GetDefaultSigningIdentity -> DEBU 013 Obtaining default signing identity
    2017-10-23 08:06:18.715 UTC [msp/identity] Sign -> DEBU 014 Sign: plaintext: 0A9E070A1608021A0608FAC5B6CF0522...437CFD1B8D3112080A021A0012021A00 
    2017-10-23 08:06:18.715 UTC [msp/identity] Sign -> DEBU 015 Sign: digest: 97C003C138B07438ADE7F6F1ADA2250B638F4E3595541F29C659880381448AEB 
    2017-10-23 08:06:18.716 UTC [channelCmd] readBlock -> DEBU 016 Got status: &{NOT_FOUND}
    2017-10-23 08:06:18.716 UTC [msp] GetLocalMSP -> DEBU 017 Returning existing local MSP
    2017-10-23 08:06:18.716 UTC [msp] GetDefaultSigningIdentity -> DEBU 018 Obtaining default signing identity
    2017-10-23 08:06:18.740 UTC [channelCmd] InitCmdFactory -> INFO 019 Endorser and orderer connections initialized
    2017-10-23 08:06:18.940 UTC [msp] GetLocalMSP -> DEBU 01a Returning existing local MSP
    2017-10-23 08:06:18.941 UTC [msp] GetDefaultSigningIdentity -> DEBU 01b Obtaining default signing identity
    2017-10-23 08:06:18.941 UTC [msp] GetLocalMSP -> DEBU 01c Returning existing local MSP
    2017-10-23 08:06:18.941 UTC [msp] GetDefaultSigningIdentity -> DEBU 01d Obtaining default signing identity
    2017-10-23 08:06:18.941 UTC [msp/identity] Sign -> DEBU 01e Sign: plaintext: 0A9E070A1608021A0608FAC5B6CF0522...B49EE5D6EC1F12080A021A0012021A00 
    2017-10-23 08:06:18.941 UTC [msp/identity] Sign -> DEBU 01f Sign: digest: 43CDB9A7B68A8073F03D4C1ADADDD829EA0B40C07D03258A19D5D19CA076C8C5 
    2017-10-23 08:06:18.944 UTC [channelCmd] readBlock -> DEBU 020 Received block: 0
    2017-10-23 08:06:18.945 UTC [main] main -> INFO 021 Exiting.....

Then we add our peer to the channel, using the provided script joinLabChannel.sh:

    blockchain@blkchn30:~$ joinLabChannel.sh 
    2017-10-23 08:07:23.199 UTC [msp] GetLocalMSP -> DEBU 001 Returning existing local MSP
    2017-10-23 08:07:23.199 UTC [msp] GetDefaultSigningIdentity -> DEBU 002 Obtaining default signing identity
    2017-10-23 08:07:23.240 UTC [channelCmd] InitCmdFactory -> INFO 003 Endorser and orderer connections initialized
    2017-10-23 08:07:23.241 UTC [msp/identity] Sign -> DEBU 004 Sign: plaintext: 0AE3070A5B08011A0B08BBC6B6CF0510...53F0CBFB06201A080A000A000A000A00 
    2017-10-23 08:07:23.241 UTC [msp/identity] Sign -> DEBU 005 Sign: digest: 0B05E99156F416AD97D82EE5A797D4A2981D59E9BED57DA026D40A3CD1EF2871 
    2017-10-23 08:07:23.356 UTC [channelCmd] executeJoin -> INFO 006 Peer joined the channel!
    2017-10-23 08:07:23.356 UTC [main] main -> INFO 007 Exiting.....

The fabric is now up, running and configured.

**Step 6:** Create a directory of your choice in the ${GOPATH}/src folder, like so:

    blockchain@blkchn32:~$ mkdir ${GOPATH}/src/chaincode

**Step 7:** Move into that directory:

    blockchain@blkchn32:~$ cd ${GOPATH}/src/chaincode

**Step 8:** We'll proceed in 4 steps with our chaincode. So we suggest to use 4 different subdirectories for each of the steps of the labs.

    blockchain@blkchn32:~$ mkdir step{1,2,3,4}

**Note:** In the subsequent steps, we'll assume the chaincodes are in different subdirectories, so will have different names when instantiated in the network.
Should you decide to do all your development in a single file, make sure to change versions at each step on the way.

Section 3: Chaincode development - step 1
=========================================

**Step 1:** Create a chaincode skeleton by copy-pasting the following code into a file you name at your convenience, in subfolder step1.

```golang
package main

import (
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type HelloWorld struct {
}

func (t *HelloWorld) Init(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}

func (t *HelloWorld) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}

func main() {
	err:= shim.Start(new(HelloWorld))
	if err!= nil{
	fmt.Printf("Error starting HelloWorld chaincode: %s", err)
	}
}
```

**Note:** There are a number of options available for editing files in Linux. Both vim and nano editors are provided in the machines. Should you prefer something else, do feel free to install another editor. Remote editing using tools like WinSCP for instance is also entirely possible.

**Step 2:** It is usually a good idea to try and compile the chaincode before installing and instantiating it. Try and compile the skeleton we created in step1/step1.go to identify potential syntax errors and fix them in advance, if any: 

    blockchain@blkchn32:~/gopath/src/chaincode/step1$ go build -v step1.go 
    github.com/hyperledger/fabric/bccsp
    github.com/hyperledger/fabric/bccsp/utils
    github.com/hyperledger/fabric/vendor/google.golang.org/grpc/grpclog
    github.com/hyperledger/fabric/common/flogging
    github.com/hyperledger/fabric/common/metadata
    github.com/hyperledger/fabric/protos/msp
    github.com/hyperledger/fabric/bccsp/sw
    github.com/hyperledger/fabric/vendor/google.golang.org/grpc/codes
    github.com/hyperledger/fabric/vendor/google.golang.org/grpc/credentials
    github.com/hyperledger/fabric/vendor/google.golang.org/grpc/internal
    github.com/hyperledger/fabric/vendor/google.golang.org/grpc/keepalive
    github.com/hyperledger/fabric/vendor/google.golang.org/grpc/metadata
    github.com/hyperledger/fabric/vendor/google.golang.org/grpc/naming
    github.com/hyperledger/fabric/vendor/google.golang.org/grpc/peer
    github.com/hyperledger/fabric/vendor/google.golang.org/grpc/stats
    github.com/hyperledger/fabric/vendor/google.golang.org/grpc/status
    github.com/hyperledger/fabric/vendor/google.golang.org/grpc/tap
    github.com/hyperledger/fabric/vendor/google.golang.org/grpc/transport
    github.com/hyperledger/fabric/bccsp/pkcs11
    github.com/hyperledger/fabric/bccsp/factory
    github.com/hyperledger/fabric/common/util
    github.com/hyperledger/fabric/protos/common
    github.com/hyperledger/fabric/vendor/google.golang.org/grpc
    github.com/hyperledger/fabric/common/ledger
    github.com/hyperledger/fabric/protos/ledger/queryresult
    github.com/hyperledger/fabric/common/crypto
    github.com/hyperledger/fabric/core/container/util
    github.com/hyperledger/fabric/core/chaincode/platforms/util
    github.com/hyperledger/fabric/bccsp/signer
    github.com/hyperledger/fabric/msp
    github.com/hyperledger/fabric/core/comm
    github.com/hyperledger/fabric/protos/peer
    github.com/hyperledger/fabric/core/chaincode/platforms/golang
    github.com/hyperledger/fabric/core/chaincode/platforms/car
    github.com/hyperledger/fabric/core/chaincode/platforms/java
    github.com/hyperledger/fabric/core/chaincode/platforms
    github.com/hyperledger/fabric/protos/utils
    github.com/hyperledger/fabric/core/chaincode/shim
    command-line-arguments

**Step 3:** Also make sure the resulting binary can be launched:

    blockchain@blkchn32:~/gopath/src/chaincode/step1$ ./step1 
    2017-10-20 15:01:31.189 CEST [shim] SetupChaincodeLogging -> INFO 001 Chaincode log level not provided; defaulting to: INFO
    2017-10-20 15:01:31.189 CEST [shim] SetupChaincodeLogging -> INFO 002 Chaincode (build level: ) starting up ...
    Error starting HelloWorld chaincode: Error chaincode id not providedblockchain@blkchn32:~/gopath/src/chaincode/step1$ 

**Step 4:** The chaincode compiles and runs, but does nothing outside of the Fabric. The next step is to instantiate it in the Fabric. In order to do that, we'll use the CLI container which has been started as part of the Fabric. Let's connect to the CLI container:

    blockchain@blkchn32:~/gopath/src/chaincode/step1$ docker exec -it cli /bin/bash
    root@@2b839fc94578:/opt/gopath/src/github.com/hyperledger/fabric/peer# 

**Step 5:** Now is time to install the chaincode onto the peer.

    root@2b839fc94578:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer chaincode install -n step1 -v1.0 -p chaincode/step1
    2017-10-23 08:49:58.634 UTC [msp] GetLocalMSP -> DEBU 001 Returning existing local MSP
    2017-10-23 08:49:58.634 UTC [msp] GetDefaultSigningIdentity -> DEBU 002 Obtaining default signing identity
    2017-10-23 08:49:58.635 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 003 Using default escc
    2017-10-23 08:49:58.635 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 004 Using default vscc
    2017-10-23 08:49:58.708 UTC [golang-platform] getCodeFromFS -> DEBU 005 getCodeFromFS chaincode/step1
    2017-10-23 08:49:58.876 UTC [golang-platform] func1 -> DEBU 006 Discarding GOROOT package fmt
    2017-10-23 08:49:58.876 UTC [golang-platform] func1 -> DEBU 007 Discarding provided package github.com/hyperledger/fabric/core/chaincode/shim
    2017-10-23 08:49:58.876 UTC [golang-platform] func1 -> DEBU 008 Discarding provided package github.com/hyperledger/fabric/protos/peer
    2017-10-23 08:49:58.876 UTC [golang-platform] GetDeploymentPayload -> DEBU 009 done
    2017-10-23 08:49:58.879 UTC [msp/identity] Sign -> DEBU 00a Sign: plaintext: 0AE4070A5C08031A0C08B6DAB6CF0510...C605F81D0000FFFF6E0DB560000A0000 
    2017-10-23 08:49:58.879 UTC [msp/identity] Sign -> DEBU 00b Sign: digest: 17B3F347C00AC33486C9AE7E31B7484926F528F36351C00BD2D3DD56D7A95CBC 
    2017-10-23 08:49:58.885 UTC [chaincodeCmd] install -> DEBU 00c Installed remotely response:<status:200 payload:"OK" > 
    2017-10-23 08:49:58.885 UTC [main] main -> INFO 00d Exiting.....
    root@2b839fc94578:/opt/gopath/src/github.com/hyperledger/fabric/peer#  

The **peer chaincode install** command requires the following arguments:

* *-n* specifies the name of the chaincode you want to deploy
* *-v* specifies the version of the chaincode you're about to deploy
* *-p* points to the folder in which to find the chaincode to install, relatively to ${GOPATH}/src 

**Step 6:** Final part of the deployment is to instantiate the chaincode. This will build a specific container, bound to a specific peer, that will execute the chaincode.

    root@2b839fc94578:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer chaincode instantiate -o orderer0:7050 -n step1 -v1.0 -C labchannel -c '{"Args":["Init"]}' -P "OR('BlockChainCoCMSP.member')"
    2017-10-23 08:56:41.586 UTC [msp] GetLocalMSP -> DEBU 001 Returning existing local MSP
    2017-10-23 08:56:41.586 UTC [msp] GetDefaultSigningIdentity -> DEBU 002 Obtaining default signing identity
    2017-10-23 08:56:41.590 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 003 Using default escc
    2017-10-23 08:56:41.590 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 004 Using default vscc
    2017-10-23 08:56:41.590 UTC [msp/identity] Sign -> DEBU 005 Sign: plaintext: 0AF0070A6808031A0C08C9DDB6CF0510...434D53500A04657363630A0476736363 
    2017-10-23 08:56:41.590 UTC [msp/identity] Sign -> DEBU 006 Sign: digest: D669F659E4A4D70084F672FC0A0CBDE09864BB14584A58A548155C423CFF891A 
    2017-10-23 08:56:59.556 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AF0070A6808031A0C08C9DDB6CF0510...4C0A711FEA0712CC97744248D6ED64BC 
    2017-10-23 08:56:59.556 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: D12BBFE967AF11D2AE6D32F70B995569048280ADE1CDA7DC3646BDF07F585487 
    2017-10-23 08:56:59.558 UTC [main] main -> INFO 009 Exiting.....
    root@2b839fc94578:/opt/gopath/src/github.com/hyperledger/fabric/peer# 

The **peer chaincode instantiate** command takes the following arguments:
 
* *-o* specifies the ordering service to converse with
* *-n* specifies the name of the chaincode you want to instantiate
* *-p* specifies the version of said chaincode
* *-C* is the channel onto which the chaincode will be instantiated
* *-c* contains the list of arguments to pass to the chaincode when instantiated. In this case, we specifiy the Init parameter, to execute the Init method when the chaincode is instatntiated.
* *-P* specifies the endorsement policy for this chaincode on this channel

**Note:** Upon successful instantiation, you will notice a new container running in your environment, like so:

    blockchain@blkchn30:~$ docker ps |grep step1
    CONTAINER ID        IMAGE                                                                                  COMMAND                  CREATED             STATUS              PORTS                                             NAMES
    b2b07b68df48        dev-peer0-step1-1.0-71189b25530a3dd0519aafc23b0dba073e3d567416c7dad58745b40ffbc13ce6   "chaincode -peer.a..."   7 minutes ago       Up 7 minutes                                                          dev-peer0-step1-1.0

Section 4: Chaincode development - step 2
=========================================

**Step 1:** Copy the template for step1 over to step2, as step2.go

    blockchain@blkchn30:~/gopath/src/chaincode/step2$ cp ../step1/step1.go step2.go

**Step 2:** Let's modify our previous, functional yet useless, chaincode to store a vkey and its value in the ledger as part of the chaincode initialization process.
Suggested if to use the PutState method to store a key of your choice, together with its value. These attributes will be passed to the Init function using the -c argument on the *peer chaincode instantiate* command. Make sure to add some logs and outputs.

**Note:** Instructor provided example can be found in the go/step2 subfolder in this directory.

**Step 3:** Install, instantiate and check to effect of the Init. The steps to follow are similar to steps 5 and 6 in the previous section. Using the instructor-provided example show the following output when instantiated:

    root@2b839fc94578:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer chaincode install -n step2 -v1.0 -p chaincode/step2
    2017-10-23 11:32:12.085 UTC [msp] GetLocalMSP -> DEBU 001 Returning existing local MSP
    2017-10-23 11:32:12.085 UTC [msp] GetDefaultSigningIdentity -> DEBU 002 Obtaining default signing identity
    2017-10-23 11:32:12.085 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 003 Using default escc
    2017-10-23 11:32:12.085 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 004 Using default vscc
    2017-10-23 11:32:12.134 UTC [golang-platform] getCodeFromFS -> DEBU 005 getCodeFromFS chaincode/step2
    2017-10-23 11:32:12.276 UTC [golang-platform] func1 -> DEBU 006 Discarding GOROOT package fmt
    2017-10-23 11:32:12.276 UTC [golang-platform] func1 -> DEBU 007 Discarding provided package github.com/hyperledger/fabric/core/chaincode/shim
    2017-10-23 11:32:12.276 UTC [golang-platform] func1 -> DEBU 008 Discarding provided package github.com/hyperledger/fabric/protos/peer
    2017-10-23 11:32:12.276 UTC [golang-platform] GetDeploymentPayload -> DEBU 009 done
    2017-10-23 11:32:12.279 UTC [msp/identity] Sign -> DEBU 00a Sign: plaintext: 0AE4070A5C08031A0C08BCA6B7CF0510...FF06DF030000FFFF9C34A79C000A0000 
    2017-10-23 11:32:12.281 UTC [msp/identity] Sign -> DEBU 00b Sign: digest: A61A7AFE8329C44EB7FFF7DDD8EF2AF7E3FB1CD90C1EE2ECDB17A013B96D4DDB 
    2017-10-23 11:32:12.286 UTC [chaincodeCmd] install -> DEBU 00c Installed remotely response:<status:200 payload:"OK" > 
    2017-10-23 11:32:12.286 UTC [main] main -> INFO 00d Exiting.....

    root@2b839fc94578:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer chaincode instantiate -o orderer0:7050 -n step2 -v1.0 -C labchannel -c '{"Args":["Init"]}' -P "OR('BlockChainCoCMSP.member')"
    2017-10-23 11:32:35.441 UTC [msp] GetLocalMSP -> DEBU 001 Returning existing local MSP
    2017-10-23 11:32:35.441 UTC [msp] GetDefaultSigningIdentity -> DEBU 002 Obtaining default signing identity
    2017-10-23 11:32:35.444 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 003 Using default escc
    2017-10-23 11:32:35.444 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 004 Using default vscc
    2017-10-23 11:32:35.445 UTC [msp/identity] Sign -> DEBU 005 Sign: plaintext: 0AF0070A6808031A0C08D3A6B7CF0510...434D53500A04657363630A0476736363 
    2017-10-23 11:32:35.445 UTC [msp/identity] Sign -> DEBU 006 Sign: digest: 49DF6119C0D03C419980D7F5233DB9F5586ED3CFCF22690CCB39A1DF4C02FEBE 
    2017-10-23 11:32:52.787 UTC [msp/identity] Sign -> DEBU 007 Sign: plaintext: 0AF0070A6808031A0C08D3A6B7CF0510...E8287D81FD1DF8DE61442EDED9B09218 
    2017-10-23 11:32:52.787 UTC [msp/identity] Sign -> DEBU 008 Sign: digest: A0CA2D1FF152690F3D1BF1B558E47AFC457505F3128643B235459B7BDF44A35A 
    2017-10-23 11:32:52.791 UTC [main] main -> INFO 009 Exiting.....

**Step4:** Check the chaincode container logs to figure out what happened:

    blockchain@blkchn30:~/gopath/src/chaincode/step2$ docker ps | grep step2
    79f6458d4414        dev-peer0-step2-1.0-e1816cadb82738bfe84fef246feaac1ced6553b3ee106a7f4dc03f498fe9a6bb   "chaincode -peer.a..."   About a minute ago   Up About a minute                                                     dev-peer0-step2-1.0
    blockchain@blkchn30:~/gopath/src/chaincode/step2$ docker logs 79f6458d4414
    Initializing chaincode HelloWorld
    blockchain@blkchn30:~/gopath/src/chaincode/step2$ 

**Note:** You can use the CouchDB database to visualize the effect of the Init()ialization of the ledger.

Section 5: Chaincode development - step 3
==========================================

**Step 1:** Copy the file step2/step2.go over to step3 as step3.go

**Step 2:** Implement the query function which will be used to query the ledger.

**Step 3:** Install, instantiate and test the function works as expected.

Section 6: Chaincode development - step 4
=========================================

**Step 1:** Copy the file step3/step3.go over to step4 as step4.go

**Step 2:** Implement the invoke function which will be used to update the ledger.

**Step 3:** Install, instantiate and test the function works as expected.
