const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// Import MSP routes
const mspRoutes = require('./msp-management/msp-routes');
const documentsRoutes = require('./routes/documents');
const kycRoutes = require('./routes/kyc');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MSP Management Routes
app.use('/api/msp', mspRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/kyc', kycRoutes);

// Fabric Network Configuration
const channelName = 'iu-channel';
const chaincodeName = 'iu-basic';
const mspId = 'IUGovMSP';
const walletPath = path.join(__dirname, 'wallet');

// Connection profile
const ccpPath = path.resolve(__dirname, '..', 'network', 'organizations', 'peerOrganizations', 'iu-gov.iu-network.com', 'connection-iu-gov.json');

// Helper function to get contract
async function getContract() {
    try {
        // Create a new file system based wallet for managing identities
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if admin identity exists in wallet
        const identity = await wallet.get('admin');
        if (!identity) {
            console.log('Admin identity not found in wallet. Please run enrollAdmin.js first');
            return null;
        }

        // Create a new gateway for connecting to our peer node
        const gateway = new Gateway();
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
        await gateway.connect(ccp, {
            wallet,
            identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network
        const contract = network.getContract(chaincodeName);

        return { contract, gateway };
    } catch (error) {
        console.error(`Failed to get contract: ${error}`);
        return null;
    }
}

// Routes

// Initialize ledger
app.post('/api/init', async (req, res) => {
    try {
        const contractInfo = await getContract();
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

// Create information record
app.post('/api/records', async (req, res) => {
    try {
        const { id, dataType, owner, data, accessLevel, permissions } = req.body;
        
        const contractInfo = await getContract();
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.submitTransaction(
            'CreateInformationRecord',
            id,
            dataType,
            owner,
            JSON.stringify(data),
            accessLevel,
            JSON.stringify(permissions)
        );
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error creating record: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Get information record by ID
app.get('/api/records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const contractInfo = await getContract();
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.evaluateTransaction('ReadInformationRecord', id);
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error reading record: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Get all information records
app.get('/api/records', async (req, res) => {
    try {
        const contractInfo = await getContract();
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.evaluateTransaction('GetAllInformationRecords');
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error getting all records: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Update information record
app.put('/api/records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data } = req.body;
        
        const contractInfo = await getContract();
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.submitTransaction(
            'UpdateInformationRecord',
            id,
            JSON.stringify(data)
        );
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error updating record: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Verify information record
app.post('/api/records/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        const { verifierOrg } = req.body;
        
        const contractInfo = await getContract();
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.submitTransaction('VerifyInformationRecord', id, verifierOrg);
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error verifying record: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Grant access
app.post('/api/records/:id/grant-access', async (req, res) => {
    try {
        const { id } = req.params;
        const { organization } = req.body;
        
        const contractInfo = await getContract();
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
app.post('/api/records/:id/revoke-access', async (req, res) => {
    try {
        const { id } = req.params;
        const { organization } = req.body;
        
        const contractInfo = await getContract();
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

// Get records by owner
app.get('/api/records/owner/:owner', async (req, res) => {
    try {
        const { owner } = req.params;
        
        const contractInfo = await getContract();
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.evaluateTransaction('GetRecordsByOwner', owner);
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error getting records by owner: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Get records by data type
app.get('/api/records/type/:dataType', async (req, res) => {
    try {
        const { dataType } = req.params;
        
        const contractInfo = await getContract();
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        const { contract, gateway } = contractInfo;
        const result = await contract.evaluateTransaction('GetRecordsByDataType', dataType);
        
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(`Error getting records by data type: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Information Utility API is running' });
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
    console.log(`Information Utility API server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});
