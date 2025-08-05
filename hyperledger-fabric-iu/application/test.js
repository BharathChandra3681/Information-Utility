const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testRecord = {
    id: 'TEST001',
    dataType: 'Identity',
    owner: 'TestCitizen123',
    data: {
        name: 'Test User',
        aadhaar: '1111-2222-3333',
        pan: 'TESTPAN123',
        dateOfBirth: '1990-05-20',
        address: 'Test Address, Test City'
    },
    accessLevel: 'restricted',
    permissions: ['iu-gov', 'iu-data']
};

async function runTests() {
    console.log('🚀 Starting Information Utility API Tests\n');

    try {
        // Test 1: Health Check
        console.log('📍 Test 1: Health Check');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check passed:', healthResponse.data);
        console.log('');

        // Test 2: Initialize Ledger
        console.log('📍 Test 2: Initialize Ledger');
        try {
            const initResponse = await axios.post(`${BASE_URL}/init`);
            console.log('✅ Ledger initialized:', initResponse.data);
        } catch (error) {
            console.log('ℹ️  Ledger already initialized or network not ready');
        }
        console.log('');

        // Test 3: Create Information Record
        console.log('📍 Test 3: Create Information Record');
        try {
            const createResponse = await axios.post(`${BASE_URL}/records`, testRecord);
            console.log('✅ Record created successfully:', createResponse.data);
        } catch (error) {
            console.log('⚠️  Record creation failed:', error.response?.data?.error || error.message);
        }
        console.log('');

        // Test 4: Get Record by ID
        console.log('📍 Test 4: Get Record by ID');
        try {
            const getResponse = await axios.get(`${BASE_URL}/records/${testRecord.id}`);
            console.log('✅ Record retrieved:', getResponse.data);
        } catch (error) {
            console.log('⚠️  Record retrieval failed:', error.response?.data?.error || error.message);
        }
        console.log('');

        // Test 5: Get All Records
        console.log('📍 Test 5: Get All Records');
        try {
            const getAllResponse = await axios.get(`${BASE_URL}/records`);
            console.log('✅ All records retrieved. Count:', getAllResponse.data.length);
        } catch (error) {
            console.log('⚠️  Get all records failed:', error.response?.data?.error || error.message);
        }
        console.log('');

        // Test 6: Verify Record
        console.log('📍 Test 6: Verify Record');
        try {
            const verifyResponse = await axios.post(`${BASE_URL}/records/${testRecord.id}/verify`, {
                verifierOrg: 'iu-gov'
            });
            console.log('✅ Record verified:', verifyResponse.data);
        } catch (error) {
            console.log('⚠️  Record verification failed:', error.response?.data?.error || error.message);
        }
        console.log('');

        // Test 7: Grant Access
        console.log('📍 Test 7: Grant Access');
        try {
            const grantResponse = await axios.post(`${BASE_URL}/records/${testRecord.id}/grant-access`, {
                organization: 'iu-service'
            });
            console.log('✅ Access granted:', grantResponse.data);
        } catch (error) {
            console.log('⚠️  Grant access failed:', error.response?.data?.error || error.message);
        }
        console.log('');

        // Test 8: Get Records by Owner
        console.log('📍 Test 8: Get Records by Owner');
        try {
            const ownerResponse = await axios.get(`${BASE_URL}/records/owner/${testRecord.owner}`);
            console.log('✅ Records by owner retrieved:', ownerResponse.data);
        } catch (error) {
            console.log('⚠️  Get records by owner failed:', error.response?.data?.error || error.message);
        }
        console.log('');

        // Test 9: Update Record
        console.log('📍 Test 9: Update Record');
        try {
            const updatedData = {
                ...testRecord.data,
                address: 'Updated Test Address, Updated City'
            };
            
            const updateResponse = await axios.put(`${BASE_URL}/records/${testRecord.id}`, {
                data: updatedData
            });
            console.log('✅ Record updated:', updateResponse.data);
        } catch (error) {
            console.log('⚠️  Record update failed:', error.response?.data?.error || error.message);
        }
        console.log('');

        console.log('🎉 All tests completed!\n');
        console.log('💡 Note: Some tests may fail if the blockchain network is not running.');
        console.log('💡 Make sure to start the network first: cd network && ./network.sh up');

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
        console.log('\n💡 Make sure the API server is running: npm start');
    }
}

// Add axios to package.json dependencies for testing
async function installTestDependencies() {
    console.log('📦 Installing test dependencies...');
    const { exec } = require('child_process');
    
    exec('npm install axios --save-dev', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Failed to install test dependencies:', error);
            return;
        }
        console.log('✅ Test dependencies installed');
        runTests();
    });
}

// Check if axios is available, install if not
try {
    require('axios');
    runTests();
} catch (e) {
    installTestDependencies();
}
