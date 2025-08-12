import { Wallets } from 'fabric-network';
import fs from 'fs/promises';
import path from 'path';

async function importIdentity({ label, mspId, certPath, keyPath, walletPath }) {
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  // remove existing
  try { await wallet.remove(label); } catch {}
  const certificate = await fs.readFile(certPath, 'utf8');
  const privateKey = await fs.readFile(keyPath, 'utf8');
  const identity = { credentials: { certificate, privateKey }, mspId, type: 'X.509' };
  await wallet.put(label, identity);
  console.log(`Imported identity '${label}' into wallet: ${walletPath}`);
}

async function main() {
  const base = "/Users/bharathchandranangunuri/Information Utility/hyperledger-fabric-iu/network/organizations/peerOrganizations";
  const walletBase = "/Users/bharathchandranangunuri/Information Utility/BlockChainIU 2/blockchainiu-next/backend/wallets";

  const entries = [
    {
      label: 'admin',
      mspId: 'CreditorMSP',
      certPath: path.join(base, 'creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp/signcerts/Admin@creditor.iu-network.com-cert.pem'),
      keyPath: path.join(base, 'creditor.iu-network.com/users/Admin@creditor.iu-network.com/msp/keystore/priv_sk'),
      walletPath: path.join(walletBase, 'creditor'),
    },
    {
      label: 'admin',
      mspId: 'DebtorMSP',
      certPath: path.join(base, 'debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp/signcerts/Admin@debtor.iu-network.com-cert.pem'),
      keyPath: path.join(base, 'debtor.iu-network.com/users/Admin@debtor.iu-network.com/msp/keystore/priv_sk'),
      walletPath: path.join(walletBase, 'debtor'),
    },
    {
      label: 'admin',
      mspId: 'AdminMSP',
      certPath: path.join(base, 'admin.iu-network.com/users/Admin@admin.iu-network.com/msp/signcerts/Admin@admin.iu-network.com-cert.pem'),
      keyPath: path.join(base, 'admin.iu-network.com/users/Admin@admin.iu-network.com/msp/keystore/priv_sk'),
      walletPath: path.join(walletBase, 'admin'),
    }
  ];

  for (const e of entries) {
    await importIdentity(e);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
