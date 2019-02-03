#! /bin/bash

# List all users in the LDAP server
docker exec my-openldap-container ldapsearch -x -L -H ldap://localhost -b dc=example,dc=org -D "cn=admin,dc=example,dc=org" -w adminpw