'use client';

import { useState } from 'react';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
    firstName: '',
    lastName: '',
    phone: '',
    organization: '',
    address: '',
    regType: '',
    regNumber: ''
  });

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      email: '',
      password: '',
      role: '',
      firstName: '',
      lastName: '',
      phone: '',
      organization: '',
      address: '',
      regType: '',
      regNumber: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = () => {
    const demoCredentials = {
      'Creditor': { email: 'creditor@hdfc.com', password: 'demo123', redirect: '/creditor-dashboard' },
      'Corporate Debtor': { email: 'corporatedebtor@reliance.com', password: 'demo123', redirect: '/borrower-dashboard' },
      'Admin': { email: 'admin@iu.gov.in', password: 'demo123', redirect: '/admin-dashboard' }
    };

    const role = formData.role;
    if (demoCredentials[role] && 
        formData.email === demoCredentials[role].email && 
        formData.password === demoCredentials[role].password) {
      
      localStorage.setItem('loggedInUser', JSON.stringify({ 
        email: formData.email, 
        role: role 
      }));
      
      window.location.href = demoCredentials[role].redirect;
    } else {
      alert('Invalid credentials or role. Please try again.');
    }
  };

  const handleRegistration = () => {
    alert('Registration submitted! Verification typically takes 24-48 hours.');
    closeModal();
  };

  return (
    <div className="font-inter">
      {/* Header */}
      <header className="bg-white shadow-md flex justify-between items-center px-8 py-4 sticky top-0 z-50">
        <div className="text-2xl font-bold text-blue-700">🔗 BlockchainIU</div>
        <div className="flex gap-4">
          <button 
            className="px-4 py-2 border-2 border-blue-700 text-blue-700 rounded-lg font-semibold hover:bg-blue-700 hover:text-white transition"
            onClick={() => openModal('login')}
          >
            Login
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-blue-900 mb-6">
            Secure Financial Data Management
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Revolutionary blockchain technology for transparent, secure, and tamper-proof recording of loan information and financial records in India's insolvency ecosystem.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button 
              className="px-8 py-3 bg-yellow-400 text-gray-900 rounded-lg font-bold hover:bg-yellow-500 transition"
              onClick={() => openModal('recording')}
            >
              Start Secure Recording
            </button>
            <button className="px-8 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition">
              Access Your Portal
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">
            Why Choose BlockchainIU?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="font-bold mb-2">Blockchain Storage</h3>
              <p className="text-gray-600">All financial records are stored immutably on blockchain with cryptographic security.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-bold mb-2">Transparent Verification</h3>
              <p className="text-gray-600">Real-time verification process between creditors and borrowers with full audit trails.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="font-bold mb-2">Multi-Role Access</h3>
              <p className="text-gray-600">Role-based authentication for Creditors, Corporate Debtors, and Admin authorities.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="text-4xl mb-4">��</div>
              <h3 className="font-bold mb-2">Tamper-Proof Records</h3>
              <p className="text-gray-600">End-to-end data integrity ensuring records cannot be altered or manipulated.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">
            Multi-Role Access System
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="font-bold text-lg mb-2">Creditor</h3>
              <p className="text-gray-600">Submit loan records, manage track status, view responses.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="font-bold text-lg mb-2">Corporate Debtor</h3>
              <p className="text-gray-600">Review loan data, confirm records, manage info.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="font-bold text-lg mb-2">Admin</h3>
              <p className="text-gray-600">Audit logs, monitor systems, generate reports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Financial Data Management?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join the future of secure, transparent financial record keeping
          </p>
          <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100 transition">
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white text-center py-8">
        <p className="mb-2">© BlockchainIU</p>
        <p className="text-sm opacity-75">Securing India's financial ecosystem with blockchain technology</p>
      </footer>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl max-w-md w-full mx-4">
            {modalType === 'login' ? (
              <div>
                <h3 className="text-2xl font-bold mb-4 text-blue-900">🔐 Secure Login</h3>
                <p className="text-gray-600 mb-4">Access your BlockchainIU portal with your credentials</p>
                
                <input
                  type="email"
                  name="email"
                  placeholder="your.email@company.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg mb-3"
                />
                
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg mb-3"
                />
                
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg mb-3"
                >
                  <option value="">Choose your role</option>
                  <option value="Creditor">Creditor</option>
                  <option value="Corporate Debtor">Corporate Debtor</option>
                  <option value="Admin">Admin</option>
                </select>
                
                <div className="text-sm bg-yellow-50 p-3 rounded-lg mb-4">
                  <strong>Demo Credentials:</strong><br />
                  Creditor: creditor@hdfc.com / demo123<br />
                  Corporate Debtor: corporatedebtor@reliance.com / demo123<br />
                  Admin: admin@iu.gov.in / demo123
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogin}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Login Securely
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold mb-4 text-blue-900">📝 Register for BlockchainIU</h3>
                <p className="text-gray-600 mb-4">Create your secure account</p>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name *"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg mb-3"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name *"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg mb-3"
                  />
                </div>
                
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg mb-3"
                />
                
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg mb-3"
                />
                
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg mb-3"
                >
                  <option value="">Select your role</option>
                  <option value="Creditor">Creditor</option>
                  <option value="Corporate Debtor">Corporate Debtor</option>
                  <option value="Admin">Admin</option>
                </select>
                
                <input
                  type="text"
                  name="organization"
                  placeholder="Organization Name *"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg mb-3"
                />
                
                <textarea
                  name="address"
                  placeholder="Organization Address"
                  rows="3"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg mb-3"
                />
                
                <select
                  name="regType"
                  value={formData.regType}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg mb-3"
                >
                  <option value="">Select Registration Type</option>
                  <option value="incorporation">Registered Incorporation Number</option>
                  <option value="aadhaar">Aadhaar Number</option>
                </select>
                
                {formData.regType === 'incorporation' && (
                  <div>
                    <label>Enter Registered Incorporation Number:</label>
                    <input
                      type="text"
                      name="regNumber"
                      placeholder="Enter Registered Incorporation Number"
                      value={formData.regNumber}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg mb-3"
                    />
                  </div>
                )}
                
                {formData.regType === 'aadhaar' && (
                  <div>
                    <label>Enter Aadhaar Number:</label>
                    <input
                      type="text"
                      name="regNumber"
                      placeholder="Enter Aadhaar Number"
                      value={formData.regNumber}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg mb-3"
                    />
                  </div>
                )}
                
                <div className="text-sm bg-yellow-50 p-3 rounded-lg mb-4">
                  <strong>Important:</strong> All registrations are subject to verification. Verification typically takes 24-48 hours.
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegistration}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Submit Application
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
