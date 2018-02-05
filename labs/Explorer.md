## Chaincode Development

Section 1: Lab overview
=======================

In this lab, we will install, configure and use Blockchain-Explorer to monitor a simple Hyperledger Fabic network.
TODO: Insert image of the configured Blockchain Explorer tool here.

Section 2: Installing Blockchain Explorer
=========================================

Blockchain Explorer is developed using Git as the Source Code Manager, and a copy of the repository is stored on GitHub.

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

**Step 2:** Clone the blockchain-explorer repository to your machine:

    blockchain@blkchn32:~$ git clone https://github.com/hyperledger/blockchain-explorer

**Step 3:** Install Blockchain Explorer prerequisites.

Looking at the website, we can find the list of prerequisites for Blockchain Explorer:
* Node.JS 6.9.x
* MySQL 5.7+
* Hyperledger Fabric 1.0.x

When MySQL was bought by Sun Microsystems back in 2008. When Sun Microsystems in turn got bought by Oracle in 2009, the Linux and
Opensource communities massively turned to a drop-in replacement of MySQL, which was more free-software friendly. This drop-in 
replacement is MariaDB.
That's the reason why in many recent Linux distributions, you'll find the MariaDB packages rather than MySQL.

lorem ipsum. Mention even though the packages are MaraiDB, the CLI tools are still mysql\*

**Step4:** Configure MariaDB.

By default, MariaDB configuration is entirely unreasonable for production.

First step is to run the mysql_secure_installation script, which will deactivate a number of undesired functions (remote root logins,
local root logins without password, test databases...).
Once done, we strongly suggest you create a specific user to access the MariaDB database used by Blockchain-Explorer.
In our setup, we created a user named blockchain to access this database.

To do so, connect to MariaDB as root, using the password you set in the mysql_secure_installtion step.

[guigui@t460 labs (master %=)]$ mysql -uroot -p
Enter password: 
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 39
Server version: 10.2.10-MariaDB MariaDB Server

Copyright (c) 2000, 2017, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MariaDB [(none)]> CREATE USER 'blockchain'@'localhost' IDENTIFIED by 'block4ever';
Query OK, 0 rows affected (0.00 sec)

MariaDB [(none)]> GRANT ALL PRIVILEGES ON fabricexplorer.\* to 'blockchain'@'localhost';
Query OK, 0 rows affected (0.00 sec)

Please note we make sure the blockchain user has full privileges on the fabricexplorer database. We also make sure this user is only allowed to connect from 
localhost.

**Step 5:** Populate the database.

The Blockchain Explorer provides a script to create the required database and database objects for us.
It is located in the db subdirectory of the blockchain-explorer Git clone.

[guigui@t460 db (master=)]$ mysql -ublockchain -p < fabricexplorer.sql 
Enter password: 
[guigui@t460 db (master=)]$ 

