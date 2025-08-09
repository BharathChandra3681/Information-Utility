const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function getGateway(identityLabel) {
  const walletPath = process.env.FABRIC_WALLET || path.join(__dirname, '..', 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const id = await wallet.get(identityLabel);
  if (!id) throw new Error(`Identity ${identityLabel} not found in wallet`);

  const ccpPath = process.env.FABRIC_CONNECTION_JSON;
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: identityLabel,
    discovery: { enabled: true, asLocalhost: true }
  });
  return gateway;
}

async function getContract(identityLabel, channelName, chaincodeName) {
  const gateway = await getGateway(identityLabel);
  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);
  return { gateway, contract };
}

module.exports = { getGateway, getContract };
