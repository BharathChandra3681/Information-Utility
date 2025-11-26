/**
 * Fabric Gateway Connection Manager
 * Handles connections to Hyperledger Fabric network using Fabric Gateway SDK
 */

const { connect, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class FabricGateway {
  constructor() {
    this.connections = new Map(); // Store connections per organization
    this.clients = new Map();
    this.gateways = new Map();
    this.cryptoPath = path.resolve(__dirname, process.env.CRYPTO_PATH || '../blockchain/network/crypto-config');
  }

  /**
   * Get TLS credentials for gRPC connection
   */
  async getTLSCredentials(orgName) {
    const tlsCertPath = path.join(
      this.cryptoPath,
      `peerOrganizations/${orgName}.iu.com/peers/peer0.${orgName}.iu.com/tls/ca.crt`
    );
    
    const tlsRootCert = await fs.readFile(tlsCertPath);
    return grpc.credentials.createSsl(tlsRootCert);
  }

  /**
   * Get peer endpoint for organization
   */
  getPeerEndpoint(orgName) {
    const endpoints = {
      government: 'localhost:7051',
      creditor: 'localhost:8051',
      debtor: 'localhost:9051'
    };
    
    return endpoints[orgName] || endpoints.government;
  }

  /**
   * Create identity for an organization
   */
  async createIdentity(orgName, mspId) {
    const certPath = path.join(
      this.cryptoPath,
      `peerOrganizations/${orgName}.iu.com/users/Admin@${orgName}.iu.com/msp/signcerts/cert.pem`
    );
    
    const keyPath = path.join(
      this.cryptoPath,
      `peerOrganizations/${orgName}.iu.com/users/Admin@${orgName}.iu.com/msp/keystore`
    );

    try {
      const certPem = await fs.readFile(certPath);
      const keyDirFiles = await fs.readdir(keyPath);
      const keyFile = keyDirFiles[0];
      const keyPem = await fs.readFile(path.join(keyPath, keyFile));

      const identity = {
        mspId: mspId,
        credentials: certPem
      };

      const signer = signers.newPrivateKeySigner(keyPem);

      return { identity, signer };
    } catch (error) {
      logger.error(`Failed to create identity for ${orgName}:`, error);
      throw new Error(`Identity creation failed for ${orgName}: ${error.message}`);
    }
  }

  /**
   * Connect to Fabric network for specific organization
   */
  async connectOrganization(orgName, mspId) {
    if (this.gateways.has(orgName)) {
      logger.info(`Using existing connection for ${orgName}`);
      return this.gateways.get(orgName);
    }

    try {
      logger.info(`Connecting to Fabric network as ${orgName} (${mspId})...`);

      // Create gRPC client
      const tlsCredentials = await this.getTLSCredentials(orgName);
      const peerEndpoint = this.getPeerEndpoint(orgName);
      const client = new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': `peer0.${orgName}.iu.com`
      });

      // Create identity and signer
      const { identity, signer } = await this.createIdentity(orgName, mspId);

      // Connect to gateway
      const gateway = connect({
        client,
        identity,
        signer
      });

      // Store connections
      this.clients.set(orgName, client);
      this.gateways.set(orgName, gateway);

      logger.info(`✓ Successfully connected to Fabric network as ${orgName}`);
      return gateway;
    } catch (error) {
      logger.error(`Failed to connect ${orgName}:`, error);
      throw error;
    }
  }

  /**
   * Get network (channel) for organization
   */
  async getNetwork(orgName, channelName) {
    const gateway = await this.getGateway(orgName);
    return gateway.getNetwork(channelName);
  }

  /**
   * Get contract from network
   */
  async getContract(orgName, channelName, chaincodeName, contractName = null) {
    const network = await this.getNetwork(orgName, channelName);
    
    if (contractName) {
      return network.getContract(chaincodeName, contractName);
    }
    
    return network.getContract(chaincodeName);
  }

  /**
   * Get gateway for organization
   */
  async getGateway(orgName) {
    let mspId;
    
    switch(orgName) {
      case 'government':
        mspId = process.env.GOVERNMENT_MSP || 'GovernmentMSP';
        break;
      case 'creditor':
        mspId = process.env.CREDITOR_MSP || 'CreditorMSP';
        break;
      case 'debtor':
        mspId = process.env.DEBTOR_MSP || 'DebtorMSP';
        break;
      default:
        throw new Error(`Unknown organization: ${orgName}`);
    }

    if (!this.gateways.has(orgName)) {
      await this.connectOrganization(orgName, mspId);
    }

    return this.gateways.get(orgName);
  }

  /**
   * Submit transaction
   */
  async submitTransaction(orgName, channelName, chaincodeName, contractName, functionName, ...args) {
    try {
      const contract = await this.getContract(orgName, channelName, chaincodeName, contractName);
      const result = await contract.submitTransaction(functionName, ...args);
      return result.toString();
    } catch (error) {
      logger.error(`Transaction submission failed:`, error);
      throw error;
    }
  }

  /**
   * Evaluate transaction (query)
   */
  async evaluateTransaction(orgName, channelName, chaincodeName, contractName, functionName, ...args) {
    try {
      const contract = await this.getContract(orgName, channelName, chaincodeName, contractName);
      const result = await contract.evaluateTransaction(functionName, ...args);
      return result.toString();
    } catch (error) {
      logger.error(`Transaction evaluation failed:`, error);
      throw error;
    }
  }

  /**
   * Close all connections
   */
  async close() {
    logger.info('Closing all Fabric gateway connections...');
    
    for (const [orgName, gateway] of this.gateways.entries()) {
      try {
        gateway.close();
        logger.info(`✓ Closed gateway for ${orgName}`);
      } catch (error) {
        logger.error(`Error closing gateway for ${orgName}:`, error);
      }
    }

    for (const [orgName, client] of this.clients.entries()) {
      try {
        client.close();
        logger.info(`✓ Closed gRPC client for ${orgName}`);
      } catch (error) {
        logger.error(`Error closing client for ${orgName}:`, error);
      }
    }

    this.gateways.clear();
    this.clients.clear();
    this.connections.clear();
  }

  /**
   * Initialize connections for all organizations
   */
  async initializeAll() {
    logger.info('Initializing connections for all organizations...');
    
    const organizations = [
      { name: 'government', mspId: process.env.GOVERNMENT_MSP || 'GovernmentMSP' },
      { name: 'creditor', mspId: process.env.CREDITOR_MSP || 'CreditorMSP' },
      { name: 'debtor', mspId: process.env.DEBTOR_MSP || 'DebtorMSP' }
    ];

    const results = await Promise.allSettled(
      organizations.map(org => this.connectOrganization(org.name, org.mspId))
    );

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      logger.warn(`${failures.length} organization(s) failed to connect`);
      failures.forEach((failure, idx) => {
        logger.error(`Connection failure for ${organizations[idx].name}:`, failure.reason);
      });
    }

    const successes = results.filter(r => r.status === 'fulfilled');
    logger.info(`✓ Successfully connected ${successes.length}/${organizations.length} organizations`);
  }
}

// Export singleton instance
module.exports = new FabricGateway();
