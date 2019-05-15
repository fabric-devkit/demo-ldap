/**
 * Server-side IPFS interface
 */
const ipfsClient = require('ipfs-http-client');

function writeToIPFS(fileContent) {
    const ipfs = ipfsClient('localhost', '5001', { protocol: 'http' }); // leaving out the arguments will default to these values
    return ipfs.files.add(Buffer.from(fileContent)).then((res) => {
      let ipfsHash = res[0].hash;
      logger.log('ipfs', `Saved IPFS file`);
      return ipfsHash;
    });
  }

module.exports = writeToIPFS;