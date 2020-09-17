#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# Exit on first error, print all commands.
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

# Take down any running containers, including the LDAP server
docker-compose -f docker-compose.yml stop

# Start the HLF Docker containers
docker-compose -f docker-compose.yml up -d 

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
export FABRIC_START_TIMEOUT=20
#echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}

CHANNEL_NAME="mychannel"

docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel list | grep "$CHANNEL_NAME"
if [ $? -ne 0 ]; then
    # Create the channel
    docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c "$CHANNEL_NAME" -f /etc/hyperledger/configtx/channel.tx
    # Join peer0.org1.example.com to the channel.
    docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b "$CHANNEL_NAME".block
else
    echo "Channel already exists, will not create"
fi

## inport utils for installChaincode
. utils.sh

## Defines needed for chaincode
CC_SRC_PATH="github.com/minimalcc"
CC_RUNTIME_LANGUAGE="golang"
VERSION="1.0"

docker exec cli peer chaincode list --instantiated -C mychannel

if [ $? -ne 0 ]; then
    docker exec cli peer chaincode install -n minimalcc -v 1.0 -p "$CC_SRC_PATH" -l "$CC_RUNTIME_LANGUAGE"
    docker exec cli peer chaincode instantiate -o orderer.example.com:7050 -C "$CHANNEL_NAME" -n minimalcc -l "$CC_RUNTIME_LANGUAGE" -v 1.0 -c '{"Args":["init", "admin", "10", "B", "10"]}' -P "OR ('Org1MSP.member')"
    sleep 10
else
    echo "Chaincode already instantiated, will not reinstall"
fi
