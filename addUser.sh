#! /bin/bash

cat >/tmp/newUser.ldif <<EOF
dn: cn=Dave,dc=example,dc=org
changetype: add
cn: $1
sn: $2
objectClass: organizationalPerson
objectClass: person
objectClass: top
EOF

docker exec -b my-openldap-container ldapadd -x -w "adminpw" -D "cn=admin,dc=example,dc=org" -f /tmp/newUser.ldif