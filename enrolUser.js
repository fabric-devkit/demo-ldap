'use strict';
/*const args = process.argv;
console.log(args);
let username = "";
if(args.length == 3) {
  username = args[2];
} else {
  console.log("Usage: node enrolUser.js <username>");
  return;
}

const readline = require('readline-sync');
let password = readline.question("Enter password for user " + username + ": ", {
  hideEchoBack: true
});

enrolUser(username, password);*/

//var exports = module.exports = {};

module.exports.enrolUser = function(username, password) {
  var fabricClient = require('./config/FabricClient');
  var FabricCAClient = require('fabric-ca-client');
  var connection = fabricClient;
  var fabricCAClient;
  var newUser;
  connection.initCredentialStores().then(() => {
    fabricCAClient = connection.getCertificateAuthority();
    return connection.getUserContext(username, true);
  }).then((user) => {
    if (user) {
      throw new Error(username + " already exists");
    } else {
      return fabricCAClient.enroll({
        enrollmentID: username,
        enrollmentSecret: password,
        /*attr_reqs: [
            { name: "hf.Registrar.Roles" },
            { name: "hf.Registrar.Attributes" }
        ]*/
      }).then((enrollment) => {
        console.log(enrollment);
        console.log('Successfully enrolled user "' + username + '"');
        return connection.createUser(
            {username: username,
                mspid: 'Org1MSP',
                cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
            });
      }).then((user) => {
        newUser = user;
        return connection.setUserContext(newUser);
      }).catch((err) => {
        console.error('Failed to enroll and persist user. Error: ' + err.stack ? err.stack : err);
        throw new Error('Failed to enroll user');
      });
    }
  }).then(() => {
      console.log('Assigned the admin user to the fabric client ::' + newUser.toString());
  }).catch((err) => {
      console.error('Failed to enroll user: ' + err);
      throw new Error('Failed to enrol user');
  });
}

//module.exports = {enrolUser: 'enrolUser'};