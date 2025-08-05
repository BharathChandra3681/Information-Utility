# MSP (Membership Service Provider) Management for Information Utility

## Overview

The MSP management system provides a complete solution for managing organization members and certificates in the Hyperledger Fabric Information Utility network. This includes both backend API and frontend interfaces for user enrollment, registration, and certificate management.

## MSP Configuration Location

The MSP is defined in several key locations:

### 1. Network Configuration (`network/configtx.yaml`)
```yaml
Organizations:
  - &IUGov
    Name: IUGovMSP
    ID: IUGovMSP
    MSPDir: ../organizations/peerOrganizations/iu-gov.iu-network.com/msp
    
  - &IUData
    Name: IUDataMSP
    ID: IUDataMSP
    MSPDir: ../organizations/peerOrganizations/iu-data.iu-network.com/msp
    
  - &IUService
    Name: IUServiceMSP
    ID: IUServiceMSP
    MSPDir: ../organizations/peerOrganizations/iu-service.iu-network.com/msp
```

### 2. Crypto Configuration (`network/crypto-config.yaml`)
```yaml
PeerOrgs:
  - Name: IUGov
    Domain: iu-gov.iu-network.com
    EnableNodeOUs: true
    
  - Name: IUData
    Domain: iu-data.iu-network.com
    EnableNodeOUs: true
    
  - Name: IUService
    Domain: iu-service.iu-network.com
    EnableNodeOUs: true
```

### 3. MSP Directories Structure
```
organizations/
├── ordererOrganizations/
│   └── iu-network.com/
│       └── msp/
└── peerOrganizations/
    ├── iu-gov.iu-network.com/
    │   └── msp/
    ├── iu-data.iu-network.com/
    │   └── msp/
    └── iu-service.iu-network.com/
        └── msp/
```

## Backend API Implementation

### MSP Manager Class (`application/msp-management/msp-manager.js`)

The `MSPManager` class provides comprehensive certificate authority operations:

- **Admin Enrollment**: `enrollAdmin(orgName, adminUser, adminPassword)`
- **User Registration**: `registerUser(orgName, userId, userRole, adminUserId)`
- **User Revocation**: `revokeUser(orgName, userId, reason, adminUserId)`
- **Certificate Management**: `getUserCertInfo(userId)`
- **Organization Users**: `getOrganizationUsers(orgName)`

### REST API Endpoints (`application/msp-management/msp-routes.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/msp/admin/enroll` | Enroll admin for organization |
| POST | `/api/msp/users/register` | Register and enroll new user |
| GET | `/api/msp/organizations/:orgName/users` | Get all users in organization |
| DELETE | `/api/msp/users/revoke` | Revoke user certificate |
| GET | `/api/msp/users/:userId/certificate` | Get certificate information |
| GET | `/api/msp/organizations` | List all organizations |
| POST | `/api/msp/bulk-register` | Bulk register multiple users |

## Frontend Integration

### HTML/JavaScript Interface (`frontend/msp-management.html`)

A complete web interface providing:
- Tab-based navigation for different operations
- Form validation and error handling
- Real-time API interaction
- Responsive design for mobile devices

### React Component (`frontend/components/MSPManagement.jsx`)

Modern React component with:
- State management with hooks
- Axios for API calls
- Component-based architecture
- TypeScript-ready structure

## Getting Started

### 1. Start the Network

First, ensure your Hyperledger Fabric network is running:

```bash
cd network
./network.sh up
```

### 2. Start the Backend API

```bash
cd application
npm install
npm start
```

The API server will be available at `http://localhost:3000`

### 3. Use the Frontend Interface

#### Option A: HTML Interface
Open `frontend/msp-management.html` in your browser and start managing users.

#### Option B: React Component
Import the React component into your application:

```jsx
import MSPManagement from './components/MSPManagement';
import './components/MSPManagement.css';

function App() {
  return (
    <div className="App">
      <MSPManagement />
    </div>
  );
}
```

## Usage Examples

### 1. Enroll Admin

```bash
curl -X POST http://localhost:3000/api/msp/admin/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "orgName": "iu-gov",
    "adminUser": "admin",
    "adminPassword": "adminpw"
  }'
```

### 2. Register User

```bash
curl -X POST http://localhost:3000/api/msp/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "orgName": "iu-gov",
    "userId": "user1",
    "userRole": "client"
  }'
```

### 3. View Organization Users

```bash
curl http://localhost:3000/api/msp/organizations/iu-gov/users
```

### 4. Revoke User

```bash
curl -X DELETE http://localhost:3000/api/msp/users/revoke \
  -H "Content-Type: application/json" \
  -d '{
    "orgName": "iu-gov",
    "userId": "user1",
    "reason": "keyCompromise"
  }'
```

## Organizations in the Network

### IU Government (IUGovMSP)
- **Purpose**: Government organization for identity verification
- **Domain**: `iu-gov.iu-network.com`
- **CA URL**: `https://localhost:7054`

### IU Data (IUDataMSP)
- **Purpose**: Data management organization
- **Domain**: `iu-data.iu-network.com`
- **CA URL**: `https://localhost:8054`

### IU Service (IUServiceMSP)
- **Purpose**: Service provider organization
- **Domain**: `iu-service.iu-network.com`
- **CA URL**: `https://localhost:9054`

## Certificate Authority Features

### Supported Operations
- User enrollment and registration
- Certificate revocation with reason codes
- Certificate expiration management
- Attribute-based access control
- Organization membership validation

### Security Features
- TLS-enabled CA communication
- Certificate chain validation
- Role-based access control
- Audit trail for all operations

## Development and Integration

### Adding New Organizations

1. Update `network/crypto-config.yaml`
2. Update `network/configtx.yaml`
3. Add organization to `msp-routes.js` organizations list
4. Update Docker compose configuration
5. Regenerate network artifacts

### Custom User Attributes

The MSP manager supports custom user attributes:

```javascript
await mspManager.registerUser('iu-gov', 'user1', 'client', 'admin', {
  'department': 'IT',
  'clearance': 'secret'
});
```

### Frontend Customization

The React component is designed to be easily customizable:
- Modify `MSPManagement.css` for styling
- Extend component props for additional functionality
- Add custom validation logic
- Integrate with your authentication system

## Troubleshooting

### Common Issues

1. **CA Connection Failed**
   - Ensure CA containers are running
   - Check network connectivity
   - Verify CA URLs in configuration

2. **Admin Enrollment Failed**
   - Verify admin credentials
   - Check CA bootstrap identity
   - Ensure proper MSP configuration

3. **User Registration Failed**
   - Ensure admin is enrolled first
   - Check user ID uniqueness
   - Verify organization exists

### Debug Mode

Enable debug logging in the MSP manager:

```javascript
const mspManager = new MSPManager({ debug: true });
```

## Security Considerations

1. **Certificate Storage**: User certificates are stored in the `wallet` directory
2. **CA Security**: CAs use TLS for secure communication
3. **Access Control**: Admin privileges required for user management
4. **Certificate Validation**: All certificates are validated against CA roots
5. **Revocation**: Supports immediate certificate revocation

## API Documentation

Complete API documentation is available through the built-in endpoints. Each route includes:
- Request/response schemas
- Error handling
- Authentication requirements
- Example usage

Access the API documentation at `http://localhost:3000/api/msp/docs` (when implemented).

## Contributing

When adding new MSP features:
1. Update the MSPManager class
2. Add corresponding API routes
3. Update frontend interfaces
4. Add comprehensive tests
5. Update this documentation
