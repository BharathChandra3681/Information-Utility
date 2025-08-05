const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// Import MSP routes
const mspRoutes = require('./msp-management/msp-routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MSP Management Routes
app.use('/api/msp', mspRoutes);

// Fabric Network Configuration
const financialOperationsChannel = 'financial-operations-channel';
const auditComplianceChannel = 'audit-compliance-channel';
const chaincodeName = 'iu-basic';

// Organization configurations
const orgConfigs = {
    creditor: {
        mspId: 'CreditorMSP',
        connectionProfilePath: path.resolve(__dirname, '..', 'network', 'organizations', 'peerOrganizations', 'creditor.iu-network.com', 'connection-creditor.json'),
        walletPath: path.join(__dirname, 'wallet-creditor')
    },
    debtor: {
        mspId: 'DebtorMSP',
        connectionProfilePath: path.resolve(__dirname, '..', 'network', 'organizations', 'peerOrganizations', 'debtor.iu-network.com', 'connection-debtor.json'),
        walletPath: path.join(__dirname, 'wallet-debtor')
    },
    admin: {
        mspId: 'AdminMSP',
        connectionProfilePath: path.resolve(__dirname, '..', 'network', 'organizations', 'peerOrganizations', 'admin.iu-network.com', 'connection-admin.json'),
        walletPath: path.join(__dirname, 'wallet-admin')
    }
};

// Helper function to get contract
async function getContract(orgType = 'admin', channelName = financialOperationsChannel) {
    try {
        const orgConfig = orgConfigs[orgType];
        if (!orgConfig) {
            throw new Error(`Invalid organization type: ${orgType}`);
        }

        // Create a new file system based wallet for the organization
        const wallet = await Wallets.newFileSystemWallet(orgConfig.walletPath);

        // Check if admin identity exists in wallet
        const identity = await wallet.get('admin');
        if (!identity) {
            console.log(`Admin identity not found in wallet for ${orgType}. Please run enrollment first`);
            return null;
        }

        // Create a new gateway for connecting to our peer node
        const gateway = new Gateway();
        
        // Check if connection profile exists
        if (!fs.existsSync(orgConfig.connectionProfilePath)) {
            console.log(`Connection profile not found at ${orgConfig.connectionProfilePath}`);
            // For now, we'll use the default paths
            return null;
        }
        
        const ccp = JSON.parse(fs.readFileSync(orgConfig.connectionProfilePath, 'utf8'));
        
        await gateway.connect(ccp, {
            wallet,
            identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network
        const contract = network.getContract(chaincodeName);

        return { contract, gateway, orgType };
    } catch (error) {
        console.error(`Failed to get contract for ${orgType}: ${error}`);
        return null;
    }
}

// Routes

// Initialize ledger
app.post('/api/init', async (req, res) => {
    try {
        const contractInfo = await getContract('admin');
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.submitTransaction('InitLedger');
        
        await gateway.disconnect();
        res.json({ message: result.toString() });
    } catch (error) {
        console.error(`Error initializing ledger: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Create financial record
app.post('/api/financial-records', async (req, res) => {
    try {
        const { 
            recordId, 
            recordType, 
            creditorId, 
            debtorId, 
            financialInstitution, 
            borrower, 
            loanDetails 
        } = req.body;
        
        const contractInfo = await getContract('creditor');
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.submitTransaction(
            'CreateFinancialRecord',
            recordId,
            recordType,
            creditorId,
            debtorId,
            JSON.stringify(financialInstitution),
            JSON.stringify(borrower),
            JSON.stringify(loanDetails)
        );
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error creating financial record: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Get financial record by ID
app.get('/api/financial-records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { orgType = 'admin' } = req.query;
        
        const contractInfo = await getContract(orgType);
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.evaluateTransaction('ReadFinancialRecord', id);
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error reading financial record: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Get all financial records (Admin only)
app.get('/api/financial-records', async (req, res) => {
    try {
        const contractInfo = await getContract('admin');
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.evaluateTransaction('GetAllFinancialRecords');
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error getting all financial records: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Update financial record
app.put('/api/financial-records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { updateData, orgType = 'creditor' } = req.body;
        
        const contractInfo = await getContract(orgType);
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.submitTransaction(
            'UpdateFinancialRecord',
            id,
            JSON.stringify(updateData)
        );
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error updating financial record: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Query financial records by creditor
app.get('/api/financial-records/creditor/:creditorId', async (req, res) => {
    try {
        const { creditorId } = req.params;
        const { orgType = 'creditor' } = req.query;
        
        const contractInfo = await getContract(orgType);
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.evaluateTransaction('QueryFinancialRecordsByCreditor', creditorId);
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error querying records by creditor: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Query financial records by debtor
app.get('/api/financial-records/debtor/:debtorId', async (req, res) => {
    try {
        const { debtorId } = req.params;
        const { orgType = 'debtor' } = req.query;
        
        const contractInfo = await getContract(orgType);
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.evaluateTransaction('QueryFinancialRecordsByDebtor', debtorId);
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error querying records by debtor: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Record payment
app.post('/api/financial-records/:id/payment', async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentData } = req.body;
        
        const contractInfo = await getContract('creditor');
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.submitTransaction('RecordPayment', id, JSON.stringify(paymentData));
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error recording payment: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Verify financial record
app.post('/api/financial-records/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        const { verifierOrg, orgType = 'admin' } = req.body;
        
        const contractInfo = await getContract(orgType);
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.submitTransaction('VerifyFinancialRecord', id, verifierOrg);
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error verifying financial record: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Grant access
app.post('/api/financial-records/:id/grant-access', async (req, res) => {
    try {
        const { id } = req.params;
        const { organization } = req.body;
        
        const contractInfo = await getContract('admin');
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.submitTransaction('GrantAccess', id, organization);
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error granting access: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Revoke access
app.post('/api/financial-records/:id/revoke-access', async (req, res) => {
    try {
        const { id } = req.params;
        const { organization } = req.body;
        
        const contractInfo = await getContract('admin');
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.submitTransaction('RevokeAccess', id, organization);
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error revoking access: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Get financial record history
app.get('/api/financial-records/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        const { orgType = 'admin' } = req.query;
        
        const contractInfo = await getContract(orgType);
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.evaluateTransaction('GetFinancialRecordHistory', id);
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error getting financial record history: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Organization management endpoints
app.get('/api/organizations', (req, res) => {
    res.json({
        organizations: [
            { id: 'creditor', name: 'Creditor Organizations', mspId: 'CreditorMSP' },
            { id: 'debtor', name: 'Debtor Organizations', mspId: 'DebtorMSP' },
            { id: 'admin', name: 'Admin Organization', mspId: 'AdminMSP' }
        ]
    });
});

// Channel information
app.get('/api/channels', (req, res) => {
    res.json({
        channels: [
            { 
                name: financialOperationsChannel, 
                description: 'Financial operations and transactions',
                organizations: ['CreditorMSP', 'DebtorMSP', 'AdminMSP']
            },
            { 
                name: auditComplianceChannel, 
                description: 'Audit and compliance monitoring',
                organizations: ['AdminMSP', 'CreditorMSP']
            }
        ]
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Financial Information Utility API is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        network: {
            organizations: Object.keys(orgConfigs),
            channels: [financialOperationsChannel, auditComplianceChannel]
        }
    });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'Financial Information Utility API',
        version: '2.0.0',
        description: 'API for managing financial records in the Information Utility blockchain network',
        endpoints: {
            'POST /api/init': 'Initialize the ledger with sample data',
            'POST /api/financial-records': 'Create a new financial record',
            'GET /api/financial-records': 'Get all financial records (Admin only)',
            'GET /api/financial-records/:id': 'Get a specific financial record',
            'PUT /api/financial-records/:id': 'Update a financial record',
            'GET /api/financial-records/creditor/:creditorId': 'Get records by creditor',
            'GET /api/financial-records/debtor/:debtorId': 'Get records by debtor',
            'POST /api/financial-records/:id/payment': 'Record a payment',
            'POST /api/financial-records/:id/verify': 'Verify a financial record',
            'POST /api/financial-records/:id/grant-access': 'Grant access to an organization',
            'POST /api/financial-records/:id/revoke-access': 'Revoke access from an organization',
            'GET /api/financial-records/:id/history': 'Get financial record history',
            'GET /api/organizations': 'Get available organizations',
            'GET /api/channels': 'Get channel information',
            'GET /api/health': 'Health check endpoint',
            'GET /api/docs': 'API documentation'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Financial Information Utility API server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`API documentation: http://localhost:${PORT}/api/docs`);
    console.log('');
    console.log('Network Configuration:');
    console.log(`- Financial Operations Channel: ${financialOperationsChannel}`);
    console.log(`- Audit Compliance Channel: ${auditComplianceChannel}`);
    console.log('- Organizations: Creditor, Debtor, Admin');
});

module.exports = app;
