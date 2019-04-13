'use strict';

async function enrolUser(username, password) {
  var fabricClient = require('./config/FabricClient');
  var FabricCAClient = require('fabric-ca-client');
  var connection = fabricClient;
  var fabricCAClient;
  var newUser;
  try {
    await connection.initCredentialStores();
    fabricCAClient = connection.getCertificateAuthority();
    let user = await connection.getUserContext(username, true);
  
    if (user) {
      throw new Error(username + " already exists");
    } else {

      let enrollment = await fabricCAClient.enroll({
        enrollmentID: username,
        enrollmentSecret: password,
        /*attr_reqs: [
            { name: "hf.Registrar.Roles" },
            { name: "hf.Registrar.Attributes" }
        ]*/
      });
      console.log(enrollment);
      console.log('Successfully enrolled user "' + username + '"');
      let enrolledUser = await connection.createUser(
          {username: username,
              mspid: 'Org1MSP',
              cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
          });
        
      newUser = enrolledUser;
      await connection.setUserContext(newUser);

      console.log('Assigned the admin user to the fabric client: ' + newUser.toString());
      return("ok");
      }
    }catch(err){
      console.error('Failed to enroll user: ' + err);
      return("fail");
      // TODO: pass success or failure back to caller
  };
}


module.exports = {enrolUser: enrolUser};