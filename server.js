/* Server for interacting directly with the HLF SDK. Opens a WebSocket on port 8081 to receive commands from the web app 
*/

var WebSocketServer = require('websocket').server;
var http = require('http');

async function querycc() {
  console.log('Querying Chaincode...');
  var fabricClient = require('./config/FabricClient');
  var client = fabricClient;
  //var fabricCAClient;
  await client.initCredentialStores();
  //fabricCAClient = client.getCertificateAuthority();
  const fcn = "queryAllCars";
  const queryChaincode = require('./invoke.js').queryChaincode;
  const chaincodeContent = await queryChaincode(client, fcn);
  console.log(chaincodeContent);console.log('Querying Chaincode...');
  
}
 
var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8081, '0.0.0.0', function() {
    console.log((new Date()) + ' Server is listening on port 8081');
});
 
wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});
 
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}
 
wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('ws-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', async function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            const messageJson = JSON.parse(message.utf8Data);
            if(messageJson.messageType === 'register') {
              const username = messageJson.data.username;
              const password = messageJson.data.password;

              const enrol = require('./enrolUser').enrolUser;
              let enrolStatus = "fail";
              try{
                enrolStatus = await enrol(username, password);
                console.log("enrol finished: ", enrolStatus);
              } catch(err){
                console.log('Exception from enrol: ', err);
              }
              const reply = {
                  message: 'enrolStatus',
                  status: enrolStatus
              }
              connection.sendUTF(JSON.stringify(reply));              
            } else if(messageJson.messageType === 'queryEnrolStatus') {
              const username = messageJson.data;
              const queryEnrol = require('./enrolUser').getUserEnrolmentStatus;
              const enrolStatus = await queryEnrol(username);
              if(enrolStatus) {
                await querycc();
              }
              const reply = {
                message: 'checkEnrolStatus',
                status: enrolStatus
              }
              connection.sendUTF(JSON.stringify(reply));  
            } else if(messageJson.messageType === 'commitFile') {
              const fileContent = messageJson.data.fileContent;
              const writeToIPFS = require('./ipfs').writeToIPFS;
              const commitHash = await writeToIPFS(fileContent);
              const reply = {
                message: 'commitStatus',
                hash: commitHash
              }
              connection.sendUTF(JSON.stringify(reply));
            } else if(messageJson.messageType === 'queryChaincode') {
              console.log('Querying Chaincode...');
              var fabricClient = require('./config/FabricClient');
              var client = fabricClient;
              var fabricCAClient;
              await client.initCredentialStores();
              fabricCAClient = client.getCertificateAuthority();
              const fcn = "queryAllCars";
              const chaincodeContent = await queryChaincode(fabricCAClient, fcn);
              console.log(chaincodeContent);
            }
            
            //connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});