#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# Exit on first error, print all commands.
set -ev

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

# Take down any running containers, including the LDAP server
docker-compose -f docker-compose.yml down
# Take down any of our SDK or webApp servers
if docker ps | grep hlf-sdk-server; then
   docker stop hlf-sdk-server && docker rm -f hlf-sdk-server
fi
if docker ps | grep hlf-webapp-server; then
   docker stop hlf-webapp-server && docker rm -f hlf-webapp-server
fi

# Build our SDK server and webApp docker images..
docker build -f docker/server/Dockerfile -t hlf-ldap-server .
docker build -f docker/webApp/Dockerfile -t hlf-webapp .
# .. and run them
docker run -d --name hlf-sdk-server hlf-ldap-server:latest
docker run -d -p 3000:3000 --name hlf-webapp-server hlf-webapp:latest

# Start the HLF Docker containers
docker-compose -f docker-compose.yml up -d ldap.example.com ca.example.com orderer.example.com peer0.org1.example.com couchdb cli

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
export FABRIC_START_TIMEOUT=20
#echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}

# Create the channel
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c mychannel -f /etc/hyperledger/configtx/channel.tx
# Join peer0.org1.example.com to the channel.
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b mychannel.block

## inport utils for installChaincode
. utils.sh

## Defines needed for chaincode
CC_SRC_PATH="github.com/fabcar/go"
CHANNEL_NAME="mychannel"
CC_RUNTIME_LANGUAGE="golang"
VERSION="1.0"

## install and instantiate chaincode
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode install -n fabcar -v 1.0 -p "$CC_SRC_PATH" -l "$CC_RUNTIME_LANGUAGE"
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n fabcar -l "$CC_RUNTIME_LANGUAGE" -v 1.0 -c '{"Args":[]}' -P "OR ('Org1MSP.member')"
sleep 10
