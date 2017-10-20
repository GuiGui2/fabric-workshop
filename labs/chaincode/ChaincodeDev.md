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

Our chaincode will have to go in a subdirectory of */home/blockchain/gopath*

Section 3: Chaincode development
================================

**Step 1:** Create a directory of your choice in the ${GOPATH} folder, like so:

    blockchain@blkchn32:~$ mkdir ${GOPATH}/chaincode

**Step 2:** Move into that directory:

    blockchain@blkchn32:~$ cd ${GOPATH}/chaincode

**Step 3:** Create a chaincode skeleton by copy-pasting the following code into a file you name at your convenience.

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

