const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

function resolveOrgEnv(org) {
  const upper = org.toUpperCase();
  return {
    walletPath: process.env[`FABRIC_WALLET_${upper}`] || process.env.FABRIC_WALLET || path.join(__dirname, '..', 'wallet'),
    ccpPath: process.env[`FABRIC_CONNECTION_JSON_${upper}`] || process.env.FABRIC_CONNECTION_JSON
  };
}

async function getGatewayForOrg(org, identityLabel) {
  const { walletPath, ccpPath } = resolveOrgEnv(org);
  if (!ccpPath) throw new Error(`Missing connection profile env for ${org}`);
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const id = await wallet.get(identityLabel);
  if (!id) throw new Error(`Identity ${identityLabel} not found in wallet ${walletPath}`);

  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: identityLabel,
    discovery: { enabled: true, asLocalhost: true }
  });
  return gateway;
}

async function getContractForOrg(org, identityLabel, channelName, chaincodeName) {
  const gateway = await getGatewayForOrg(org, identityLabel);
  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);
  return { gateway, contract };
}

module.exports = { getGatewayForOrg, getContractForOrg };
