const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Updated Fabric Network Configuration for IU System
const financialOperationsChannel = 'financial-operations-channel';
const auditComplianceChannel = 'audit-compliance-channel';
const chaincodeName = 'iu-chaincode'; // Updated to match our deployed chaincode

// Organization configurations with correct paths
const orgConfigs = {
    creditor: {
        mspId: 'CreditorMSP',
        walletPath: path.join(__dirname, 'wallet-creditor'),
        // Using organizations path as confirmed working
        connectionProfilePath: path.resolve(__dirname, '..', 'network', 'organizations', 'peerOrganizations', 'creditor.iu-network.com', 'connection-creditor.json')
    },
    debtor: {
        mspId: 'DebtorMSP',
        walletPath: path.join(__dirname, 'wallet-debtor'),
        connectionProfilePath: path.resolve(__dirname, '..', 'network', 'organizations', 'peerOrganizations', 'debtor.iu-network.com', 'connection-debtor.json')
    },
    admin: {
        mspId: 'AdminMSP',
        walletPath: path.join(__dirname, 'wallet-admin'),
        connectionProfilePath: path.resolve(__dirname, '..', 'network', 'organizations', 'peerOrganizations', 'admin.iu-network.com', 'connection-admin.json')
    }
};

// Helper function to get contract with improved error handling
async function getContract(orgType = 'admin', channelName = financialOperationsChannel) {
    try {
        const orgConfig = orgConfigs[orgType];
        if (!orgConfig) {
            throw new Error(`Invalid organization type: ${orgType}`);
        }

        console.log(`🔗 Connecting as ${orgType} to channel ${channelName}`);

        // Create wallet directory if it doesn't exist
        if (!fs.existsSync(orgConfig.walletPath)) {
            fs.mkdirSync(orgConfig.walletPath, { recursive: true });
        }

        const wallet = await Wallets.newFileSystemWallet(orgConfig.walletPath);

        // For now, we'll simulate the connection since TLS issues need to be resolved
        // This structure is ready for when the network is fully operational
        console.log(`📋 Wallet path: ${orgConfig.walletPath}`);
        console.log(`🏢 MSP ID: ${orgConfig.mspId}`);
        console.log(`📡 Channel: ${channelName}`);
        
        return {
            orgType,
            channelName,
            chaincodeName,
            mspId: orgConfig.mspId,
            status: 'ready_for_tls_resolution'
        };

    } catch (error) {
        console.error(`❌ Failed to get contract: ${error.message}`);
        return null;
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Information Utility Client Application',
        version: '2.0.0',
        channels: [financialOperationsChannel, auditComplianceChannel],
        chaincode: chaincodeName,
        organizations: Object.keys(orgConfigs),
        timestamp: new Date().toISOString()
    });
});

// Initialize IU Ledger
app.post('/api/init', async (req, res) => {
    try {
        console.log('🚀 Initializing Information Utility Ledger...');
        
        const contractInfo = await getContract('admin', financialOperationsChannel);
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        // Simulate initialization for now
        const result = {
            status: 'initialized',
            message: 'IU Ledger ready for operations',
            accounts_created: 3,
            channels: [financialOperationsChannel, auditComplianceChannel],
            ready_for_transactions: true,
            note: 'Full initialization pending TLS resolution'
        };

        console.log('✅ Ledger initialization simulated successfully');
        res.json(result);

    } catch (error) {
        console.error('❌ Initialization failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create Financial Transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const { id, creditorId, debtorId, amount, currency, transactionType, description } = req.body;
        
        console.log(`💰 Creating transaction: ${id}`);
        
        const contractInfo = await getContract('creditor', financialOperationsChannel);
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to financial operations channel' });
        }

        // Simulate transaction creation
        const transaction = {
            id,
            creditorId,
            debtorId,
            amount: parseFloat(amount),
            currency,
            transactionType,
            description,
            status: 'PENDING',
            timestamp: new Date().toISOString(),
            hash: `HASH_${id}_${Date.now()}`,
            complianceChecked: false,
            validatedBy: '',
            channel: financialOperationsChannel
        };

        console.log('✅ Transaction created successfully (simulated)');
        res.json({
            success: true,
            transaction,
            message: 'Transaction created successfully',
            note: 'Full execution pending TLS resolution'
        });

    } catch (error) {
        console.error('❌ Transaction creation failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Perform Compliance Check
app.post('/api/compliance/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { approved } = req.body;
        
        console.log(`📋 Performing compliance check for transaction: ${transactionId}`);
        
        const contractInfo = await getContract('admin', auditComplianceChannel);
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to audit compliance channel' });
        }

        // Simulate compliance check
        const complianceResult = {
            transactionId,
            approved: approved !== false, // Default to approved unless explicitly false
            checkedBy: 'AdminMSP',
            timestamp: new Date().toISOString(),
            status: approved !== false ? 'APPROVED' : 'REJECTED',
            channel: auditComplianceChannel,
            auditRecord: `AUDIT_${transactionId}_${Date.now()}`
        };

        console.log('✅ Compliance check completed (simulated)');
        res.json({
            success: true,
            compliance: complianceResult,
            message: 'Compliance check completed',
            note: 'Full execution pending TLS resolution'
        });

    } catch (error) {
        console.error('❌ Compliance check failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Process Transaction
app.post('/api/transactions/:transactionId/process', async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        console.log(`⚡ Processing transaction: ${transactionId}`);
        
        const contractInfo = await getContract('debtor', financialOperationsChannel);
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to financial operations channel' });
        }

        // Simulate transaction processing
        const processResult = {
            transactionId,
            status: 'COMPLETED',
            processedBy: 'DebtorMSP',
            timestamp: new Date().toISOString(),
            channel: financialOperationsChannel,
            message: 'Transaction processed successfully'
        };

        console.log('✅ Transaction processed successfully (simulated)');
        res.json({
            success: true,
            result: processResult,
            message: 'Transaction processing completed',
            note: 'Full execution pending TLS resolution'
        });

    } catch (error) {
        console.error('❌ Transaction processing failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Transaction by ID
app.get('/api/transactions/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { org = 'admin' } = req.query;
        
        console.log(`🔍 Querying transaction: ${transactionId}`);
        
        const contractInfo = await getContract(org, financialOperationsChannel);
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        // Simulate transaction query
        const transaction = {
            id: transactionId,
            creditorId: 'CREDITOR001',
            debtorId: 'DEBTOR001',
            amount: 50000.00,
            currency: 'USD',
            transactionType: 'CREDIT',
            status: 'COMPLETED',
            timestamp: new Date().toISOString(),
            description: 'Sample transaction for demonstration',
            hash: `HASH_${transactionId}_${Date.now()}`,
            complianceChecked: true,
            validatedBy: 'DebtorMSP',
            channel: financialOperationsChannel
        };

        console.log('✅ Transaction retrieved successfully (simulated)');
        res.json({
            success: true,
            transaction,
            note: 'Simulated data - full query pending TLS resolution'
        });

    } catch (error) {
        console.error('❌ Transaction query failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get All Transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const { org = 'admin', channel = financialOperationsChannel } = req.query;
        
        console.log(`📊 Querying all transactions from ${channel}`);
        
        const contractInfo = await getContract(org, channel);
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to network' });
        }

        // Simulate transaction list
        const transactions = [
            {
                id: 'TX001',
                creditorId: 'CREDITOR001',
                debtorId: 'DEBTOR001',
                amount: 50000.00,
                currency: 'USD',
                status: 'COMPLETED',
                timestamp: new Date().toISOString(),
                channel
            },
            {
                id: 'TX002',
                creditorId: 'CREDITOR001',
                debtorId: 'DEBTOR002',
                amount: 25000.00,
                currency: 'USD',
                status: 'PENDING',
                timestamp: new Date().toISOString(),
                channel
            }
        ];

        console.log('✅ Transaction list retrieved successfully (simulated)');
        res.json({
            success: true,
            count: transactions.length,
            transactions,
            channel,
            note: 'Simulated data - full query pending TLS resolution'
        });

    } catch (error) {
        console.error('❌ Transaction list query failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Transaction History
app.get('/api/transactions/:transactionId/history', async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        console.log(`📜 Querying transaction history: ${transactionId}`);
        
        const contractInfo = await getContract('admin', auditComplianceChannel);
        if (!contractInfo) {
            return res.status(500).json({ error: 'Failed to connect to audit channel' });
        }

        // Simulate transaction history
        const history = [
            {
                txId: 'TXN_CREATE_001',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                action: 'CREATE_TRANSACTION',
                actor: 'CreditorMSP',
                status: 'PENDING'
            },
            {
                txId: 'TXN_COMPLIANCE_001',
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                action: 'COMPLIANCE_CHECK',
                actor: 'AdminMSP',
                status: 'APPROVED'
            },
            {
                txId: 'TXN_PROCESS_001',
                timestamp: new Date().toISOString(),
                action: 'PROCESS_TRANSACTION',
                actor: 'DebtorMSP',
                status: 'COMPLETED'
            }
        ];

        console.log('✅ Transaction history retrieved successfully (simulated)');
        res.json({
            success: true,
            transactionId,
            historyCount: history.length,
            history,
            note: 'Simulated data - full history pending TLS resolution'
        });

    } catch (error) {
        console.error('❌ Transaction history query failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Network Status Endpoint
app.get('/api/network/status', async (req, res) => {
    try {
        const status = {
            network: 'Information Utility Blockchain',
            status: 'operational',
            organizations: {
                creditor: { mspId: 'CreditorMSP', status: 'active' },
                debtor: { mspId: 'DebtorMSP', status: 'active' },
                admin: { mspId: 'AdminMSP', status: 'active' }
            },
            channels: {
                [financialOperationsChannel]: { status: 'ready', participants: 3 },
                [auditComplianceChannel]: { status: 'ready', participants: 3 }
            },
            chaincode: {
                name: chaincodeName,
                version: '1.0',
                status: 'deployed'
            },
            issues: {
                tls_certificates: 'resolution_pending',
                impact: 'blocking_live_transactions'
            },
            timestamp: new Date().toISOString()
        };

        res.json(status);

    } catch (error) {
        console.error('❌ Network status query failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('🚨 Application error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        available_endpoints: [
            'GET /api/health',
            'POST /api/init',
            'POST /api/transactions',
            'POST /api/compliance/:transactionId',
            'POST /api/transactions/:transactionId/process',
            'GET /api/transactions/:transactionId',
            'GET /api/transactions',
            'GET /api/transactions/:transactionId/history',
            'GET /api/network/status'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Information Utility Client Application Started');
    console.log('==============================================');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🏢 Organizations: ${Object.keys(orgConfigs).join(', ')}`);
    console.log(`📺 Channels: ${financialOperationsChannel}, ${auditComplianceChannel}`);
    console.log(`⚙️  Chaincode: ${chaincodeName}`);
    console.log('');
    console.log('📋 Available Endpoints:');
    console.log('  • GET  /api/health - Service health check');
    console.log('  • POST /api/init - Initialize IU ledger');
    console.log('  • POST /api/transactions - Create financial transaction');
    console.log('  • POST /api/compliance/:id - Perform compliance check');
    console.log('  • POST /api/transactions/:id/process - Process transaction');
    console.log('  • GET  /api/transactions/:id - Get transaction details');
    console.log('  • GET  /api/transactions - Get all transactions');
    console.log('  • GET  /api/transactions/:id/history - Get transaction history');
    console.log('  • GET  /api/network/status - Network status');
    console.log('');
    console.log('⚠️  Note: TLS resolution required for live blockchain operations');
    console.log('🎯 Ready for testing once network connectivity is restored');
});

module.exports = app;
