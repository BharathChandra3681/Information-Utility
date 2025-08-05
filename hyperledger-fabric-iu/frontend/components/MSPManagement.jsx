import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MSPManagement = () => {
  const [activeTab, setActiveTab] = useState('enroll-admin');
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const API_BASE = 'http://localhost:3000/api/msp';

  useEffect(() => {
    loadOrganizations();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const loadOrganizations = async () => {
    try {
      const response = await axios.get(`${API_BASE}/organizations`);
      setOrganizations(response.data.organizations);
    } catch (error) {
      showMessage(`Error loading organizations: ${error.message}`, 'error');
    }
  };

  const enrollAdmin = async (formData) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/admin/enroll`, formData);
      showMessage(`Admin ${formData.adminUser} successfully enrolled for ${formData.orgName}!`);
    } catch (error) {
      showMessage(error.response?.data?.error || 'Failed to enroll admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (formData) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/users/register`, formData);
      showMessage(`User ${formData.userId} successfully registered for ${formData.orgName}!`);
    } catch (error) {
      showMessage(error.response?.data?.error || 'Failed to register user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (orgName) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/organizations/${orgName}/users`);
      setUsers(response.data.users);
      showMessage(`Loaded ${response.data.count} users for ${orgName}`);
    } catch (error) {
      showMessage(error.response?.data?.error || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const revokeUser = async (orgName, userId, reason = 'unspecified') => {
    if (!window.confirm(`Are you sure you want to revoke user ${userId} from ${orgName}?`)) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/users/revoke`, {
        data: { orgName, userId, reason }
      });
      showMessage(`User ${userId} successfully revoked from ${orgName}!`);
      // Refresh users list
      loadUsers(orgName);
    } catch (error) {
      showMessage(error.response?.data?.error || 'Failed to revoke user', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="msp-management">
      <h1>Information Utility - Member Management</h1>
      <p>Manage organization members and MSP certificates for the Hyperledger Fabric Information Utility network.</p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="tabs">
        {['enroll-admin', 'register-user', 'view-users', 'revoke-user', 'organizations'].map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {activeTab === 'enroll-admin' && (
        <EnrollAdminForm
          organizations={organizations}
          onSubmit={enrollAdmin}
          loading={loading}
        />
      )}

      {activeTab === 'register-user' && (
        <RegisterUserForm
          organizations={organizations}
          onSubmit={registerUser}
          loading={loading}
        />
      )}

      {activeTab === 'view-users' && (
        <ViewUsers
          organizations={organizations}
          users={users}
          onLoadUsers={loadUsers}
          onRevokeUser={revokeUser}
          loading={loading}
        />
      )}

      {activeTab === 'revoke-user' && (
        <RevokeUserForm
          organizations={organizations}
          onSubmit={(formData) => revokeUser(formData.orgName, formData.userId, formData.reason)}
          loading={loading}
        />
      )}

      {activeTab === 'organizations' && (
        <OrganizationsList
          organizations={organizations}
          onSelectOrg={(orgName) => {
            setActiveTab('view-users');
            loadUsers(orgName);
          }}
        />
      )}
    </div>
  );
};

const EnrollAdminForm = ({ organizations, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    orgName: '',
    adminUser: 'admin',
    adminPassword: 'adminpw'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="section">
      <h2>Enroll Admin</h2>
      <p>Enroll an admin user for an organization. This is required before registering other users.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Organization:</label>
          <select
            value={formData.orgName}
            onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
            required
          >
            <option value="">Select Organization</option>
            {organizations.map(org => (
              <option key={org.name} value={org.name}>
                {org.description} ({org.mspId})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Admin Username:</label>
          <input
            type="text"
            value={formData.adminUser}
            onChange={(e) => setFormData({ ...formData, adminUser: e.target.value })}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Admin Password:</label>
          <input
            type="password"
            value={formData.adminPassword}
            onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Enrolling...' : 'Enroll Admin'}
        </button>
      </form>
    </div>
  );
};

const RegisterUserForm = ({ organizations, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    orgName: '',
    userId: '',
    userRole: 'client'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ ...formData, userId: '' }); // Clear user ID after submission
  };

  return (
    <div className="section">
      <h2>Register New User</h2>
      <p>Register and enroll a new user in an organization.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Organization:</label>
          <select
            value={formData.orgName}
            onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
            required
          >
            <option value="">Select Organization</option>
            {organizations.map(org => (
              <option key={org.name} value={org.name}>
                {org.description} ({org.mspId})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>User ID:</label>
          <input
            type="text"
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            placeholder="e.g., user1"
            required
          />
        </div>
        
        <div className="form-group">
          <label>User Role:</label>
          <select
            value={formData.userRole}
            onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
          >
            <option value="client">Client</option>
            <option value="peer">Peer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register User'}
        </button>
      </form>
    </div>
  );
};

const ViewUsers = ({ organizations, users, onLoadUsers, onRevokeUser, loading }) => {
  const [selectedOrg, setSelectedOrg] = useState('');

  const handleLoadUsers = () => {
    if (selectedOrg) {
      onLoadUsers(selectedOrg);
    }
  };

  return (
    <div className="section">
      <h2>View Organization Users</h2>
      <p>View all users enrolled in an organization.</p>
      
      <div className="form-group">
        <label>Organization:</label>
        <select
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
        >
          <option value="">Select Organization</option>
          {organizations.map(org => (
            <option key={org.name} value={org.name}>
              {org.description} ({org.mspId})
            </option>
          ))}
        </select>
      </div>
      
      <button onClick={handleLoadUsers} disabled={!selectedOrg || loading}>
        {loading ? 'Loading...' : 'Load Users'}
      </button>

      {users.length > 0 && (
        <div className="users-list">
          <h3>Users in {selectedOrg}:</h3>
          {users.map(user => (
            <div key={user.userId} className="user-item">
              <div>
                <strong>{user.userId}</strong> - {user.role}
                <br />
                <small>Enrolled: {user.enrollmentDate}</small>
              </div>
              <button
                onClick={() => onRevokeUser(selectedOrg, user.userId)}
                className="btn-danger"
                disabled={loading}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RevokeUserForm = ({ organizations, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    orgName: '',
    userId: '',
    reason: 'unspecified'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ ...formData, userId: '' }); // Clear user ID after submission
  };

  return (
    <div className="section">
      <h2>Revoke User Certificate</h2>
      <p>Revoke a user's certificate to remove their access to the network.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Organization:</label>
          <select
            value={formData.orgName}
            onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
            required
          >
            <option value="">Select Organization</option>
            {organizations.map(org => (
              <option key={org.name} value={org.name}>
                {org.description} ({org.mspId})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>User ID to Revoke:</label>
          <input
            type="text"
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Reason for Revocation:</label>
          <select
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          >
            <option value="unspecified">Unspecified</option>
            <option value="keyCompromise">Key Compromise</option>
            <option value="cACompromise">CA Compromise</option>
            <option value="affiliationChanged">Affiliation Changed</option>
            <option value="superseded">Superseded</option>
            <option value="cessationOfOperation">Cessation of Operation</option>
          </select>
        </div>
        
        <button type="submit" className="btn-danger" disabled={loading}>
          {loading ? 'Revoking...' : 'Revoke User'}
        </button>
      </form>
    </div>
  );
};

const OrganizationsList = ({ organizations, onSelectOrg }) => {
  return (
    <div className="section">
      <h2>Network Organizations</h2>
      <p>View all organizations in the Information Utility network.</p>
      
      <div className="organizations-list">
        {organizations.map(org => (
          <div key={org.name} className="user-item">
            <div>
              <strong>{org.name}</strong> ({org.mspId})
              <br />
              <small>{org.description}</small>
              <br />
              <small>Domain: {org.domain}</small>
            </div>
            <button
              onClick={() => onSelectOrg(org.name)}
              className="btn-success"
            >
              View Users
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MSPManagement;
