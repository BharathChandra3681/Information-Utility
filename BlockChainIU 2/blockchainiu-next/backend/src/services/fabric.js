import fs from 'fs';
import { Gateway, Wallets } from 'fabric-network';

const channelName = process.env.FABRIC_CHANNEL || 'financial-operations-channel';
const chaincodeName = process.env.FABRIC_CHAINCODE || 'iu-basic';
const walletPath = process.env.FABRIC_WALLET_PATH; // e.g. wallet-admin
const ccpPath = process.env.FABRIC_CONNECTION_PROFILE;
const identityLabel = process.env.FABRIC_IDENTITY || 'admin';

async function getContract() {
  if (!walletPath || !ccpPath) {
    throw new Error('FABRIC_WALLET_PATH and FABRIC_CONNECTION_PROFILE must be set');
  }
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const identity = await wallet.get(identityLabel);
  if (!identity) {
    throw new Error(`Identity ${identityLabel} not found in wallet at ${walletPath}`);
  }

  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: identityLabel,
    discovery: { enabled: true, asLocalhost: true },
  });
  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);
  return { contract, gateway };
}

export async function initLedger() {
  const { contract, gateway } = await getContract();
  try {
    const result = await contract.submitTransaction('InitLedger');
    return result.toString();
  } finally {
    await gateway.disconnect();
  }
}

export async function storeDocumentHash(documentId, sha256, owner, metadata = {}) {
  const { contract, gateway } = await getContract();
  try {
    const result = await contract.submitTransaction(
      'StoreDocumentHash',
      documentId,
      sha256,
      owner,
      JSON.stringify(metadata)
    );
    return result.toString();
  } finally {
    await gateway.disconnect();
  }
}

