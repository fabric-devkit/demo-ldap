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

To (re)build the webApp docker image, run ``docker-compose build``.
To start the network, run ``start.sh``.
To stop it, run ``stop.sh``
To completely remove the network on your system, run ``teardown.sh``.

## LDAP usage
The LDAP container is initialised with an admin user, with a username of ``admin`` and password ``adminpw``. These can be used directly with the webapp, or used to create new users.
To create a new user on the LDAP server, run ``addUser.sh <firstname> <lastname>``. This will create a user with the username ``<firstname><lastname>``. Enter a password for the user when prompted. You can then enrol this user in the CA using ``enrolUser.sh <username> <password>``.

Once an LDAP user has been created, it must be registered with the Fabric CA container, which can be done via a script or in the webapp.
The script ``enrolUser.sh`` allows a user to enrol an LDAP account in the CA, specifying a username and password.

## Webapp
A simple web app is included, providing a user logon interface which will allow authenticated to interact with an example installed chaincode.

Having built the webApp docker container using the ``docker-compose build`` command, start up the network with ``start.sh``. If you do not already have the Fabric containers installed, this may take some time to complete. 

Once the start script has completed, open a browser, and open ``localhost:30000``.

The ``I need to create an account`` route enrols a previously created LDAP user into the Fabric CA using the NodeJS SDK. Enrolment of users should persist across 
stopping and restarting the network, using the provided scripts. If you need to start with a fresh set of users, running ``docker-compose down`` 
will remove the internally-stored set of users in both LDAP and Fabric. The next time the notwork is started, only the 'admin' user will exist 
on the LDAP server, and will require re-enrolling on the Fabric client.

The user can log on using any account that exists on the LDAP server, but Fabric functionality will only work if that user has been enrolled with the Fabric CA. To demonstrate this, the user's home page displays a "Fabric Enrollmment status" line that displays the result of a query to the CA using the NodeJS SDK.

The demo application has been configured with a simple chaincode that assigns a notional balance to a user. Try enrolling and logging on as the ``admin`` user, and you should see something like this:
![Alt text](images/authenticated.png?raw=true "Enrolled Logon")
The "Enrollmment status" line on the home page shows "true".
The "Current holdings" line shows the result of running a query as the current enrolled user. In the case of the admin user, this will return 10.

Now if you create a new user, and log into the webapp without enrolling the user in the CA, you should see the following behaviour:
The user can still log in (as the login is authenticated from LDAP, not the CA)
The "Enrollment status" line in the user home account will show "false".
The chaincode query field will be empty.

![Alt text](images/unauthenticated.png?raw=true "Unenrolled Logon")

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>

## Maintainer
David Carrington (dmcarrington@googlemail.com)