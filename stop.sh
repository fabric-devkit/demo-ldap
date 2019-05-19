#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error, print all commands.
set -ev

# Stop any of our SDK or webApp servers
if docker ps | grep hlf-sdk-server; then
   docker stop hlf-sdk-server 
   docker rm -f hlf-sdk-server
fi
if docker ps | grep hlf-webapp-server; then
   docker stop hlf-webapp-server 
   docker rm -f hlf-webapp-server
fi

# Shut down the Docker containers that might be currently running.
docker-compose -f docker-compose.yml down
