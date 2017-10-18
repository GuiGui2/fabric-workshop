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
