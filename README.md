# Hyperledger Fabric LDAP interface

This repository holds example code for using LDAP authentication for enrolling users in the Hyperledger Fabric CA. At present, all interactions are carried out using shell scripts.

## Aims for future development
1) Add scripts to add and remove users on the LDAP docker.
2) Start using SDK functions where possible to replace shell scripting.
3) Add a simple web UI to allow a user to log on, authenticated against the LDAP server, and then execute chaincode as that user.

## Basic Network Config

Note that this basic configuration uses pre-generated certificates and
key material, and also has predefined transactions to initialize a 
channel named "mychannel".

To regenerate this material, simply run ``generate.sh``.

To start the network, run ``start.sh``.
To stop it, run ``stop.sh``
To completely remove all incriminating evidence of the network
on your system, run ``teardown.sh``.

## Usage
To enrol the initial Admin user in the CA, run ``enrolAdmin.sh``.
To add a new user to the LDAP server, run ``addUser.sh <firstname> <lastname>``. This will create a user with the username ``<firsrname><lastname>``. Enter a password for the user when prompted. You can then enrol this user in the CA using ``enrolUser.sh <username> <password>``.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>

## Maintainer
David Carrington (dmcarrington@googlemail.com)