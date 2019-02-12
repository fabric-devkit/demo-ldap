'use strict';
var fabricClient = require('./config/FabricClient');
var FabricCAClient = require('fabric-ca-client');
var connection = fabricClient;
var fabricCAClient;
var adminUser;
connection.initCredentialStores().then(() => {
  fabricCAClient = connection.getCertificateAuthority();
  return connection.getUserContext('admin', true);
}).then((user) => {
  if (user) {
    throw new Error("Admin already exists");
  } else {
    return fabricCAClient.enroll({
      enrollmentID: 'admin',
      enrollmentSecret: 'adminpw',
      /*attr_reqs: [
          { name: "hf.Registrar.Roles" },
          { name: "hf.Registrar.Attributes" }
      ]*/
    }).then((enrollment) => {
      console.log('Successfully enrolled admin user "admin"');
      return connection.createUser(
          {username: 'admin',
              mspid: 'Org1MSP',
              cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
          });
    }).then((user) => {
      adminUser = user;
      return connection.setUserContext(adminUser);
    }).catch((err) => {
      console.error('Failed to enroll and persist admin. Error: ' + err.stack ? err.stack : err);
      throw new Error('Failed to enroll admin');
    });
  }
}).then(() => {
    console.log('Assigned the admin user to the fabric client ::' + adminUser.toString());
}).catch((err) => {
    console.error('Failed to enroll admin: ' + err);
});
