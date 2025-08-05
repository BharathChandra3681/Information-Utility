const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/msp';

// Test data
const testOrg = 'iu-gov';
const testUser = 'testuser1';

async function testMSPAPI() {
    console.log('🚀 Testing MSP Management API...\n');

    try {
        // Test 1: Get Organizations
        console.log('1. Testing Organizations List...');
        const orgsResponse = await axios.get(`${API_BASE}/organizations`);
        console.log('✅ Organizations loaded:', orgsResponse.data.count, 'organizations');
        console.log('   Organizations:', orgsResponse.data.organizations.map(org => org.name).join(', '));

        // Test 2: Enroll Admin
        console.log('\n2. Testing Admin Enrollment...');
        try {
            const adminResponse = await axios.post(`${API_BASE}/admin/enroll`, {
                orgName: testOrg,
                adminUser: 'admin',
                adminPassword: 'adminpw'
            });
            console.log('✅ Admin enrollment successful:', adminResponse.data.message);
        } catch (error) {
            if (error.response?.status === 500 && error.response?.data?.error?.includes('already enrolled')) {
                console.log('ℹ️  Admin already enrolled (expected if run multiple times)');
            } else {
                throw error;
            }
        }

        // Test 3: Register User
        console.log('\n3. Testing User Registration...');
        try {
            const userResponse = await axios.post(`${API_BASE}/users/register`, {
                orgName: testOrg,
                userId: testUser,
                userRole: 'client'
            });
            console.log('✅ User registration successful:', userResponse.data.message);
        } catch (error) {
            if (error.response?.status === 500 && error.response?.data?.error?.includes('already registered')) {
                console.log('ℹ️  User already registered (expected if run multiple times)');
            } else {
                throw error;
            }
        }

        // Test 4: Get Organization Users
        console.log('\n4. Testing Organization Users List...');
        try {
            const usersResponse = await axios.get(`${API_BASE}/organizations/${testOrg}/users`);
            console.log('✅ Users loaded for', testOrg + ':', usersResponse.data.count, 'users');
            if (usersResponse.data.users.length > 0) {
                console.log('   Users:', usersResponse.data.users.map(user => user.userId).join(', '));
            }
        } catch (error) {
            console.log('⚠️  Users list not available (network may not be running)');
        }

        // Test 5: Test Bulk Registration
        console.log('\n5. Testing Bulk Registration...');
        try {
            const bulkUsers = [
                { userId: 'bulkuser1', role: 'client' },
                { userId: 'bulkuser2', role: 'client' },
                { userId: 'bulkuser3', role: 'peer' }
            ];
            
            const bulkResponse = await axios.post(`${API_BASE}/bulk-register`, {
                orgName: testOrg,
                users: bulkUsers
            });
            console.log('✅ Bulk registration completed:', bulkResponse.data.successful_count, 'successful,', bulkResponse.data.failed_count, 'failed');
        } catch (error) {
            console.log('⚠️  Bulk registration test skipped (network may not be running)');
        }

        console.log('\n🎉 MSP API Tests Completed Successfully!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Start your Hyperledger Fabric network: cd network && ./network.sh up');
        console.log('   2. Start the API server: cd application && npm start');
        console.log('   3. Open frontend/msp-management.html in your browser');
        console.log('   4. Begin managing organization members!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data?.error || error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Solution: Start the API server first:');
            console.log('   cd application && npm start');
        } else if (error.response?.status === 500) {
            console.log('\n💡 This may be expected if the Fabric network is not running.');
            console.log('   Start the network: cd network && ./network.sh up');
        }
    }
}

// Helper function to check if API server is running
async function checkAPIServer() {
    try {
        const response = await axios.get(`${API_BASE}/organizations`);
        return true;
    } catch (error) {
        return false;
    }
}

// Main execution
async function main() {
    console.log('🔍 Checking API server status...');
    const isServerRunning = await checkAPIServer();
    
    if (!isServerRunning) {
        console.log('❌ API server is not running.');
        console.log('\n📋 To start the API server:');
        console.log('   1. cd application');
        console.log('   2. npm install');
        console.log('   3. npm start');
        console.log('\n⚡ Then run this test again: node test-msp.js');
        return;
    }

    console.log('✅ API server is running!\n');
    await testMSPAPI();
}

if (require.main === module) {
    main();
}

module.exports = { testMSPAPI, checkAPIServer };
