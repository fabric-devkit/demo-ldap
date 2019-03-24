var fabricClient = require('../config/FabricClient');

class ExampleNetwork {
  constructor(userName) {
    this.currentUser;
    this.issuer;
    this.userName = userName;
    this.connection = fabricClient;
  }
  init() {
    var isAdmin = false;
    if (this.userName === "admin") {
      isAdmin = true;
    }
    return this.connection.initCredentialStores().then(() => {
      return this.connection.getUserContext(this.userName, true)
    }).then((user) => {
      this.issuer = user;
      if (isAdmin) {
        return user;
      }
      return this.ping();
    }).then((user) => {
      this.currentUser = user;
      return user;
    })
  }
   sell(data) {
    var tx_id = this.connection.newTransactionID();
    var requestData = {
      fcn: 'createProduct',
      args: [data.from, data.to, data.product, data.quantity],
      txId: tx_id
    };
    var request = FabricModel.requestBuild(requestData);
    return this.connection.submitTransaction(request);
  }
}
