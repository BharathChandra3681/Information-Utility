const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Enhanced test data for Information Utility
const testTransactions = [
    {
        id: 'TX_TRADE_001',
        creditorId: 'EXPORT_COMPANY_ABC',
        debtorId: 'IMPORT_COMPANY_XYZ',
        amount: 250000.00,
        currency: 'USD',
        transactionType: 'CREDIT',
        description: 'International trade payment for textile shipment - Container ABCD1234'
    },
    {
        id: 'TX_SETTLEMENT_002',
        creditorId: 'BANK_CREDITOR_001',
        debtorId: 'CORPORATE_DEBTOR_002',
        amount: 75000.00,
        currency: 'USD',
        transactionType: 'DEBIT',
        description: 'Corporate loan settlement - Facility Agreement REF789'
    },
    {
        id: 'TX_PAYMENT_003',
        creditorId: 'SUPPLIER_GLOBAL_123',
        debtorId: 'MANUFACTURER_INDIA_456',
        amount: 125000.00,
        currency: 'USD',
        transactionType: 'TRANSFER',
        description: 'Supply chain payment for raw materials - Purchase Order PO2024-0815'
    }
];

async function runIUTests() {
    console.log('🚀 Information Utility Comprehensive Test Suite');
    console.log('===============================================');
    console.log(`📡 Testing API at: ${BASE_URL}`);
    console.log(`🕐 Started at: ${new Date().toISOString()}\n`);

    let testResults = {
        passed: 0,
        failed: 0,
        total: 0,
        details: []
    };

    async function runTest(testName, testFunction) {
        testResults.total++;
        console.log(`\n📍 Test ${testResults.total}: ${testName}`);
        console.log('─'.repeat(50));
        
        try {
            await testFunction();
            testResults.passed++;
            console.log(`✅ ${testName} - PASSED`);
            testResults.details.push({ test: testName, status: 'PASSED', error: null });
        } catch (error) {
            testResults.failed++;
            console.log(`❌ ${testName} - FAILED`);
            console.log(`   Error: ${error.message}`);
            testResults.details.push({ test: testName, status: 'FAILED', error: error.message });
        }
    }

    // Test 1: API Health Check
    await runTest('API Health Check', async () => {
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('📊 Service Status:', response.data.status);
        console.log('🏢 Organizations:', response.data.organizations.join(', '));
        console.log('📺 Channels:', response.data.channels.join(', '));
        console.log('⚙️  Chaincode:', response.data.chaincode);
        
        if (response.data.status !== 'healthy') {
            throw new Error('Service is not healthy');
        }
    });

    // Test 2: Network Status Check
    await runTest('Network Status Check', async () => {
        const response = await axios.get(`${BASE_URL}/network/status`);
        console.log('🌐 Network:', response.data.network);
        console.log('📊 Organizations Status:', Object.keys(response.data.organizations).length);
        console.log('📺 Channels Status:', Object.keys(response.data.channels).length);
        console.log('⚠️  Issues:', response.data.issues.tls_certificates);
        
        if (response.data.status !== 'operational') {
            throw new Error('Network is not operational');
        }
    });

    // Test 3: Initialize IU Ledger
    await runTest('Initialize IU Ledger', async () => {
        const response = await axios.post(`${BASE_URL}/init`);
        console.log('🚀 Initialization Status:', response.data.status);
        console.log('💰 Accounts Created:', response.data.accounts_created);
        console.log('📺 Channels Configured:', response.data.channels.join(', '));
        console.log('✅ Ready for Transactions:', response.data.ready_for_transactions);
        
        if (response.data.status !== 'initialized') {
            throw new Error('Ledger initialization failed');
        }
    });

    // Test 4: Create Financial Transactions
    for (let i = 0; i < testTransactions.length; i++) {
        const tx = testTransactions[i];
        await runTest(`Create Transaction ${tx.id}`, async () => {
            const response = await axios.post(`${BASE_URL}/transactions`, tx);
            console.log('💰 Transaction ID:', response.data.transaction.id);
            console.log('💵 Amount:', `${response.data.transaction.currency} ${response.data.transaction.amount.toLocaleString()}`);
            console.log('📊 Status:', response.data.transaction.status);
            console.log('🔗 Channel:', response.data.transaction.channel);
            console.log('📝 Description:', response.data.transaction.description.substring(0, 50) + '...');
            
            if (!response.data.success) {
                throw new Error('Transaction creation failed');
            }
        });
    }

    // Test 5: Perform Compliance Checks
    for (let i = 0; i < testTransactions.length; i++) {
        const tx = testTransactions[i];
        const approved = i !== 1; // Reject the second transaction for testing
        
        await runTest(`Compliance Check ${tx.id}`, async () => {
            const response = await axios.post(`${BASE_URL}/compliance/${tx.id}`, { approved });
            console.log('📋 Transaction ID:', response.data.compliance.transactionId);
            console.log('✅ Approved:', response.data.compliance.approved);
            console.log('👤 Checked By:', response.data.compliance.checkedBy);
            console.log('📊 Status:', response.data.compliance.status);
            console.log('🔗 Channel:', response.data.compliance.channel);
            console.log('📄 Audit Record:', response.data.compliance.auditRecord);
            
            if (!response.data.success) {
                throw new Error('Compliance check failed');
            }
        });
    }

    // Test 6: Process Approved Transactions
    const approvedTransactions = testTransactions.filter((_, i) => i !== 1); // Skip rejected transaction
    
    for (const tx of approvedTransactions) {
        await runTest(`Process Transaction ${tx.id}`, async () => {
            const response = await axios.post(`${BASE_URL}/transactions/${tx.id}/process`);
            console.log('⚡ Transaction ID:', response.data.result.transactionId);
            console.log('📊 Status:', response.data.result.status);
            console.log('👤 Processed By:', response.data.result.processedBy);
            console.log('🔗 Channel:', response.data.result.channel);
            console.log('📅 Timestamp:', response.data.result.timestamp);
            
            if (!response.data.success) {
                throw new Error('Transaction processing failed');
            }
        });
    }

    // Test 7: Query Individual Transactions
    for (const tx of testTransactions) {
        await runTest(`Query Transaction ${tx.id}`, async () => {
            const response = await axios.get(`${BASE_URL}/transactions/${tx.id}`);
            console.log('🔍 Transaction ID:', response.data.transaction.id);
            console.log('💰 Amount:', `${response.data.transaction.currency} ${response.data.transaction.amount.toLocaleString()}`);
            console.log('📊 Status:', response.data.transaction.status);
            console.log('✅ Compliance Checked:', response.data.transaction.complianceChecked);
            console.log('👤 Validated By:', response.data.transaction.validatedBy || 'Pending');
            
            if (!response.data.success) {
                throw new Error('Transaction query failed');
            }
        });
    }

    // Test 8: Query All Transactions
    await runTest('Query All Transactions (Financial Channel)', async () => {
        const response = await axios.get(`${BASE_URL}/transactions?channel=financial-operations-channel`);
        console.log('📊 Total Transactions:', response.data.count);
        console.log('🔗 Channel:', response.data.channel);
        console.log('📋 Sample Transaction IDs:', response.data.transactions.map(tx => tx.id).join(', '));
        
        if (!response.data.success || response.data.count === 0) {
            throw new Error('Transaction list query failed or empty');
        }
    });

    // Test 9: Query Transaction History
    for (const tx of testTransactions.slice(0, 2)) { // Test first 2 transactions
        await runTest(`Transaction History ${tx.id}`, async () => {
            const response = await axios.get(`${BASE_URL}/transactions/${tx.id}/history`);
            console.log('📜 Transaction ID:', response.data.transactionId);
            console.log('📊 History Count:', response.data.historyCount);
            console.log('🔄 Actions:', response.data.history.map(h => h.action).join(' → '));
            console.log('👥 Actors:', [...new Set(response.data.history.map(h => h.actor))].join(', '));
            
            if (!response.data.success || response.data.historyCount === 0) {
                throw new Error('Transaction history query failed or empty');
            }
        });
    }

    // Test 10: Multi-Organization Query Test
    await runTest('Multi-Organization Query Test', async () => {
        const orgs = ['creditor', 'debtor', 'admin'];
        let queryResults = [];
        
        for (const org of orgs) {
            const response = await axios.get(`${BASE_URL}/transactions?org=${org}`);
            queryResults.push({ org, count: response.data.count });
            console.log(`👥 ${org.toUpperCase()} perspective: ${response.data.count} transactions`);
        }
        
        if (queryResults.some(r => r.count === 0)) {
            throw new Error('Some organizations have no transaction visibility');
        }
    });

    // Test Summary
    console.log('\n🎯 TEST SUITE SUMMARY');
    console.log('=====================');
    console.log(`📊 Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    console.log(`🕐 Completed at: ${new Date().toISOString()}`);

    if (testResults.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        console.log('─'.repeat(40));
        testResults.details
            .filter(detail => detail.status === 'FAILED')
            .forEach(detail => {
                console.log(`• ${detail.test}: ${detail.error}`);
            });
    }

    console.log('\n🚀 INFORMATION UTILITY TEST RESULTS');
    console.log('====================================');
    
    if (testResults.failed === 0) {
        console.log('🎉 ALL TESTS PASSED! Information Utility API is working correctly.');
        console.log('🔧 Ready for blockchain network integration once TLS is resolved.');
    } else {
        console.log('⚠️  Some tests failed. Review the errors above.');
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('• Resolve TLS certificate verification issues');
    console.log('• Deploy chaincode to live channels');
    console.log('• Execute real blockchain transactions');
    console.log('• Integrate with production systems');
    
    return testResults;
}

// Run tests if this script is executed directly
if (require.main === module) {
    runIUTests().catch(error => {
        console.error('❌ Test suite execution failed:', error.message);
        process.exit(1);
    });
}

module.exports = { runIUTests, testTransactions };
