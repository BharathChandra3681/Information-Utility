import fs from 'fs';
import { Gateway, Wallets } from 'fabric-network';

const channelName = process.env.FABRIC_CHANNEL || 'financial-operations-channel';
const chaincodeName = process.env.FABRIC_CHAINCODE || 'iu-basic';

function resolveOrgEnv(org) {
  const upper = org.toUpperCase();
  return {
    walletPath:
      process.env[`FABRIC_${upper}_WALLET_PATH`] || process.env.FABRIC_WALLET_PATH,
    ccpPath:
      process.env[`FABRIC_${upper}_CONNECTION_PROFILE`] || process.env.FABRIC_CONNECTION_PROFILE,
    identityLabel:
      process.env[`FABRIC_${upper}_IDENTITY`] || process.env.FABRIC_IDENTITY || 'admin',
  };
}

async function getContractFor(org = 'admin') {
  const { walletPath, ccpPath, identityLabel } = resolveOrgEnv(org);
  if (!walletPath || !ccpPath) {
    throw new Error(`Wallet/Connection not configured for org=${org}. Set FABRIC_${org.toUpperCase()}_* or generic FABRIC_* envs.`);
  }
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const identity = await wallet.get(identityLabel);
  if (!identity) {
    throw new Error(`Identity ${identityLabel} not found in wallet at ${walletPath} for org=${org}`);
  }

  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: identityLabel,
    discovery: { enabled: false, asLocalhost: true },
  });
  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);
  return { contract, gateway };
}

export async function initLedger(org = 'admin') {
  const { contract, gateway } = await getContractFor(org);
  try {
    const result = await contract.submitTransaction('InitLedger');
    return result.toString();
  } finally {
    await gateway.disconnect();
  }
}

export async function storeDocumentHash(documentId, sha256, owner, metadata = {}, org = 'admin') {
  const { contract, gateway } = await getContractFor(org);
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

export async function submitSimpleLoan(loanId, borrowerName, loanAmount, loanStartDate, maturityDate, org = 'creditor') {
  const { contract, gateway } = await getContractFor(org);
  try {
    const tx = contract.createTransaction('SubmitSimpleLoan');
    tx.setEndorsingPeers([
      'peer0.creditor.iu-network.com',
      'peer0.debtor.iu-network.com'
    ]);
    const result = await tx.submit(loanId, borrowerName, String(loanAmount), loanStartDate, maturityDate || '');
    return JSON.parse(result.toString());
  } finally {
    await gateway.disconnect();
  }
}

export async function approveLoanByAdmin(loanId, org = 'admin') {
  const { contract, gateway } = await getContractFor(org);
  try {
    const tx = contract.createTransaction('ApproveLoanByAdmin');
    tx.setEndorsingOrganizations('CreditorMSP','DebtorMSP');
    const result = await tx.submit(loanId);
    return JSON.parse(result.toString());
  } finally {
    await gateway.disconnect();
  }
}

export async function rejectLoanByAdmin(loanId, reason, org = 'admin') {
  const { contract, gateway } = await getContractFor(org);
  try {
    const tx = contract.createTransaction('RejectLoanByAdmin');
    tx.setEndorsingOrganizations('CreditorMSP','DebtorMSP');
    const result = await tx.submit(loanId, reason || '');
    return JSON.parse(result.toString());
  } finally {
    await gateway.disconnect();
  }
}

export async function approveLoanByBorrower(loanId, org = 'debtor') {
  const { contract, gateway } = await getContractFor(org);
  try {
    const tx = contract.createTransaction('ApproveLoanByBorrower');
    tx.setEndorsingOrganizations('CreditorMSP','DebtorMSP');
    const result = await tx.submit(loanId);
    return JSON.parse(result.toString());
  } finally {
    await gateway.disconnect();
  }
}

export async function rejectLoanByBorrower(loanId, reason, org = 'debtor') {
  const { contract, gateway } = await getContractFor(org);
  try {
    const tx = contract.createTransaction('RejectLoanByBorrower');
    tx.setEndorsingOrganizations('CreditorMSP','DebtorMSP');
    const result = await tx.submit(loanId, reason || '');
    return JSON.parse(result.toString());
  } finally {
    await gateway.disconnect();
  }
}

export async function getSimpleLoans(org = 'admin') {
  const { contract, gateway } = await getContractFor(org);
  try {
    const result = await contract.evaluateTransaction('GetSimpleLoans');
    return JSON.parse(result.toString());
  } finally {
    await gateway.disconnect();
  }
}

export { getContractFor };

