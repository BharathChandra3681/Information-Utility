const express = require('express');
const MSPManager = require('./msp-manager');

const router = express.Router();
const mspManager = new MSPManager();

// Initialize MSP Manager
mspManager.initializeCAClients().catch(console.error);

/**
 * @route POST /api/msp/admin/enroll
 * @desc Enroll admin for an organization
 */
router.post('/admin/enroll', async (req, res) => {
    try {
        const { orgName, adminUser = 'admin', adminPassword = 'adminpw' } = req.body;

        if (!orgName) {
            return res.status(400).json({ error: 'Organization name is required' });
        }

        const result = await mspManager.enrollAdmin(orgName, adminUser, adminPassword);
        
        res.json({
            success: true,
            message: `Admin enrolled for ${orgName}`,
            adminUser: adminUser,
            mspId: result.mspId
        });
    } catch (error) {
        console.error('Error enrolling admin:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/msp/users/register
 * @desc Register and enroll a new user
 */
router.post('/users/register', async (req, res) => {
    try {
        const { orgName, userId, userRole = 'client', adminUserId = 'admin' } = req.body;

        if (!orgName || !userId) {
            return res.status(400).json({ error: 'Organization name and user ID are required' });
        }

        const result = await mspManager.registerUser(orgName, userId, userRole, adminUserId);
        
        res.json({
            success: true,
            message: `User ${userId} registered and enrolled`,
            user: result
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/msp/organizations/:orgName/users
 * @desc Get all users for an organization
 */
router.get('/organizations/:orgName/users', async (req, res) => {
    try {
        const { orgName } = req.params;
        const users = await mspManager.getOrganizationUsers(orgName);
        
        res.json({
            success: true,
            organization: orgName,
            users: users,
            count: users.length
        });
    } catch (error) {
        console.error('Error getting organization users:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route DELETE /api/msp/users/revoke
 * @desc Revoke a user's certificate
 */
router.delete('/users/revoke', async (req, res) => {
    try {
        const { orgName, userId, reason = 'unspecified', adminUserId = 'admin' } = req.body;

        if (!orgName || !userId) {
            return res.status(400).json({ error: 'Organization name and user ID are required' });
        }

        const result = await mspManager.revokeUser(orgName, userId, reason, adminUserId);
        
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error revoking user:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/msp/users/:userId/certificate
 * @desc Get certificate information for a user
 */
router.get('/users/:userId/certificate', async (req, res) => {
    try {
        const { userId } = req.params;
        const certInfo = await mspManager.getUserCertInfo(userId);
        
        res.json({
            success: true,
            certificate: certInfo
        });
    } catch (error) {
        console.error('Error getting certificate info:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/msp/organizations/:orgName/connection-profile
 * @desc Generate connection profile for an organization
 */
router.get('/organizations/:orgName/connection-profile', async (req, res) => {
    try {
        const { orgName } = req.params;
        const connectionProfile = mspManager.generateConnectionProfile(orgName);
        
        res.json({
            success: true,
            organization: orgName,
            connectionProfile: connectionProfile
        });
    } catch (error) {
        console.error('Error generating connection profile:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/msp/organizations
 * @desc Get list of all organizations
 */
router.get('/organizations', async (req, res) => {
    try {
        const organizations = [
            {
                name: 'iu-gov',
                mspId: 'IUGovMSP',
                description: 'Government Organization for Identity Verification',
                domain: 'iu-gov.iu-network.com'
            },
            {
                name: 'iu-data',
                mspId: 'IUDataMSP',
                description: 'Data Management Organization',
                domain: 'iu-data.iu-network.com'
            },
            {
                name: 'iu-service',
                mspId: 'IUServiceMSP',
                description: 'Service Provider Organization',
                domain: 'iu-service.iu-network.com'
            }
        ];

        res.json({
            success: true,
            organizations: organizations,
            count: organizations.length
        });
    } catch (error) {
        console.error('Error getting organizations:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/msp/bulk-register
 * @desc Bulk register multiple users
 */
router.post('/bulk-register', async (req, res) => {
    try {
        const { orgName, users, adminUserId = 'admin' } = req.body;

        if (!orgName || !users || !Array.isArray(users)) {
            return res.status(400).json({ error: 'Organization name and users array are required' });
        }

        const results = [];
        const errors = [];

        for (const user of users) {
            try {
                const result = await mspManager.registerUser(
                    orgName, 
                    user.userId, 
                    user.role || 'client', 
                    adminUserId
                );
                results.push(result);
            } catch (error) {
                errors.push({
                    userId: user.userId,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Bulk registration completed for ${orgName}`,
            successful: results,
            failed: errors,
            totalRequested: users.length,
            successful_count: results.length,
            failed_count: errors.length
        });
    } catch (error) {
        console.error('Error in bulk registration:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
