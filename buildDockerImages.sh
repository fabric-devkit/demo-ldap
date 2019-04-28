#! /bin/bash
# Build the HLF SDK server
docker build -f docker/server/Dockerfile -t hlf-ldap-server .

# web application
docker build -f docker/webApp/Dockerfile -t hlf-webapp .