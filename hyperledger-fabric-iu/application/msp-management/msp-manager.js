const { Wallets, X509WalletMixin } = require('fabric-network');
const { Enrollments } = require('fabric-ca-client');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

/**
 * MSP Management Service for Information Utility Network
 * Handles user enrollment, certificate management, and organization membership
 */
class MSPManager {
    constructor() {
        this.caClients = new Map();
        this.walletPath = path.join(__dirname, '..', 'wallet');
        this.cryptoPath = path.join(__dirname, '..', '..', 'network', 'organizations');
    }

    /**
     * Initialize CA clients for all organizations
     */
    async initializeCAClients() {
        const organizations = ['iu-gov', 'iu-data', 'iu-service'];
        
        for (const org of organizations) {
            try {
                const caInfo = this.getCAInfo(org);
                const caTLSCACerts = fs.readFileSync(caInfo.tlsCACertPath, 'utf8');
                const ca = new FabricCAServices(caInfo.caURL, { 
                    trustedRoots: caTLSCACerts, 
                    verify: false 
                }, caInfo.caName);
                
                this.caClients.set(org, ca);
                console.log(`✅ CA client initialized for ${org}`);
            } catch (error) {
                console.error(`❌ Failed to initialize CA for ${org}:`, error.message);
            }
        }
    }

    /**
     * Get CA information for an organization
     */
    getCAInfo(orgName) {
        const caInfoMap = {
            'iu-gov': {
                caURL: 'https://ca.iu-gov.iu-network.com:7054',
                caName: 'ca-iu-gov',
                mspId: 'IUGovMSP',
                tlsCACertPath: path.join(this.cryptoPath, 'peerOrganizations', 'iu-gov.iu-network.com', 'ca', 'ca.iu-gov.iu-network.com-cert.pem')
            },
            'iu-data': {
                caURL: 'https://ca.iu-data.iu-network.com:8054',
                caName: 'ca-iu-data',
                mspId: 'IUDataMSP',
                tlsCACertPath: path.join(this.cryptoPath, 'peerOrganizations', 'iu-data.iu-network.com', 'ca', 'ca.iu-data.iu-network.com-cert.pem')
            },
            'iu-service': {
                caURL: 'https://ca.iu-service.iu-network.com:9054',
                caName: 'ca-iu-service',
                mspId: 'IUServiceMSP',
                tlsCACertPath: path.join(this.cryptoPath, 'peerOrganizations', 'iu-service.iu-network.com', 'ca', 'ca.iu-service.iu-network.com-cert.pem')
            }
        };

        return caInfoMap[orgName];
    }

    /**
     * Enroll admin user for an organization
     */
    async enrollAdmin(orgName, adminUser = 'admin', adminPassword = 'adminpw') {
        try {
            const caClient = this.caClients.get(orgName);
            const caInfo = this.getCAInfo(orgName);
            
            if (!caClient) {
                throw new Error(`CA client not found for organization: ${orgName}`);
            }

            // Create wallet if it doesn't exist
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);

            // Check if admin already enrolled
            const adminIdentity = await wallet.get(adminUser);
            if (adminIdentity) {
                console.log(`Admin user ${adminUser} already enrolled for ${orgName}`);
                return adminIdentity;
            }

            // Enroll admin
            const enrollment = await caClient.enroll({
                enrollmentID: adminUser,
                enrollmentSecret: adminPassword
            });

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: caInfo.mspId,
                type: 'X.509',
            };

            await wallet.put(adminUser, x509Identity);
            console.log(`✅ Admin ${adminUser} enrolled successfully for ${orgName}`);
            return x509Identity;

        } catch (error) {
            console.error(`❌ Failed to enroll admin for ${orgName}:`, error);
            throw error;
        }
    }

    /**
     * Register and enroll a new user
     */
    async registerUser(orgName, userId, userRole = 'client', adminUserId = 'admin') {
        try {
            const caClient = this.caClients.get(orgName);
            const caInfo = this.getCAInfo(orgName);
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);

            if (!caClient) {
                throw new Error(`CA client not found for organization: ${orgName}`);
            }

            // Check if user already exists
            const userIdentity = await wallet.get(userId);
            if (userIdentity) {
                console.log(`User ${userId} already exists for ${orgName}`);
                return userIdentity;
            }

            // Get admin identity
            const adminIdentity = await wallet.get(adminUserId);
            if (!adminIdentity) {
                throw new Error(`Admin identity ${adminUserId} not found. Please enroll admin first.`);
            }

            // Build user object for authenticating with the CA
            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

            // Register the user
            const secret = await caClient.register({
                affiliation: `${orgName}.department1`,
                enrollmentID: userId,
                role: userRole,
                attrs: [
                    { name: 'role', value: userRole, ecert: true },
                    { name: 'organization', value: orgName, ecert: true }
                ]
            }, adminUser);

            // Enroll the user
            const enrollment = await caClient.enroll({
                enrollmentID: userId,
                enrollmentSecret: secret
            });

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: caInfo.mspId,
                type: 'X.509',
            };

            await wallet.put(userId, x509Identity);
            console.log(`✅ User ${userId} registered and enrolled successfully for ${orgName}`);
            
            return {
                userId: userId,
                organization: orgName,
                mspId: caInfo.mspId,
                role: userRole,
                enrollmentDate: new Date().toISOString(),
                certificate: enrollment.certificate
            };

        } catch (error) {
            console.error(`❌ Failed to register user ${userId} for ${orgName}:`, error);
            throw error;
        }
    }

    /**
     * Get all users in wallet for an organization
     */
    async getOrganizationUsers(orgName) {
        try {
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);
            const caInfo = this.getCAInfo(orgName);
            const identities = await wallet.list();
            
            const orgUsers = [];
            for (const [label, identity] of identities) {
                if (identity.mspId === caInfo.mspId) {
                    orgUsers.push({
                        userId: label,
                        mspId: identity.mspId,
                        type: identity.type,
                        organization: orgName
                    });
                }
            }

            return orgUsers;
        } catch (error) {
            console.error(`❌ Failed to get users for ${orgName}:`, error);
            throw error;
        }
    }

    /**
     * Revoke a user's certificate
     */
    async revokeUser(orgName, userId, reason = 'unspecified', adminUserId = 'admin') {
        try {
            const caClient = this.caClients.get(orgName);
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);

            // Get admin identity
            const adminIdentity = await wallet.get(adminUserId);
            if (!adminIdentity) {
                throw new Error(`Admin identity ${adminUserId} not found`);
            }

            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

            // Revoke the user
            await caClient.revoke({
                enrollmentID: userId,
                reason: reason
            }, adminUser);

            // Remove from wallet
            await wallet.remove(userId);

            console.log(`✅ User ${userId} revoked successfully from ${orgName}`);
            return { success: true, message: `User ${userId} revoked` };

        } catch (error) {
            console.error(`❌ Failed to revoke user ${userId} from ${orgName}:`, error);
            throw error;
        }
    }

    /**
     * Get certificate information for a user
     */
    async getUserCertInfo(userId) {
        try {
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);
            const identity = await wallet.get(userId);

            if (!identity) {
                throw new Error(`User ${userId} not found in wallet`);
            }

            // Parse certificate to get information
            const cert = identity.credentials.certificate;
            const certLines = cert.split('\n');
            const certData = certLines.slice(1, -1).join('');
            
            return {
                userId: userId,
                mspId: identity.mspId,
                type: identity.type,
                certificate: cert,
                certificateData: certData,
                hasPrivateKey: !!identity.credentials.privateKey
            };

        } catch (error) {
            console.error(`❌ Failed to get certificate info for ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Generate connection profile for an organization
     */
    generateConnectionProfile(orgName) {
        const caInfo = this.getCAInfo(orgName);
        const peerPort = orgName === 'iu-gov' ? 7051 : orgName === 'iu-data' ? 8051 : 9051;
        
        return {
            name: `${orgName}-network`,
            version: '1.0.0',
            client: {
                organization: caInfo.mspId,
                connection: {
                    timeout: {
                        peer: {
                            endorser: '300'
                        }
                    }
                }
            },
            organizations: {
                [caInfo.mspId]: {
                    mspid: caInfo.mspId,
                    peers: [`peer0.${orgName}.iu-network.com`],
                    certificateAuthorities: [caInfo.caName]
                }
            },
            peers: {
                [`peer0.${orgName}.iu-network.com`]: {
                    url: `grpcs://localhost:${peerPort}`,
                    tlsCACerts: {
                        path: path.join(this.cryptoPath, 'peerOrganizations', `${orgName}.iu-network.com`, 'peers', `peer0.${orgName}.iu-network.com`, 'tls', 'ca.crt')
                    },
                    grpcOptions: {
                        'ssl-target-name-override': `peer0.${orgName}.iu-network.com`
                    }
                }
            },
            certificateAuthorities: {
                [caInfo.caName]: {
                    url: caInfo.caURL,
                    caName: caInfo.caName,
                    tlsCACerts: {
                        path: caInfo.tlsCACertPath
                    },
                    httpOptions: {
                        verify: false
                    }
                }
            }
        };
    }
}

module.exports = MSPManager;
