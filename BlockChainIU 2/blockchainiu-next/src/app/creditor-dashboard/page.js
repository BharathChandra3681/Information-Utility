'use client';

import { useState, useEffect } from 'react';

export default function CreditorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [submittedRecords, setSubmittedRecords] = useState([]);
  const [formData, setFormData] = useState({
    borrowerName: '',
    loanAmount: '',
    loanStartDate: '',
    maturityDate: '',
    loanStatus: '',
    assetRecords: '',
    balanceSheet: '',
    existingLiabilities: ''
  });
  const [dropdownStatus, setDropdownStatus] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [loanIdForUpload, setLoanIdForUpload] = useState('');
  const [uploadResponse, setUploadResponse] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [myDocs, setMyDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    // Check logged in user role
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'Creditor') {
      alert('Unauthorized access. Please login as Creditor.');
      window.location.href = '/';
    }
    // Load submitted records from localStorage
    const records = JSON.parse(localStorage.getItem('submittedRecords')) || [];
    setSubmittedRecords(records);
    // Load my documents list
    loadMyDocs(loggedInUser?.email);
  }, []);

  const logout = () => {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/';
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownToggle = (id) => {
    setDropdownStatus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDropdownSelect = (id, status) => {
    setDropdownStatus(prev => ({
      ...prev,
      [id]: false
    }));
    setSubmittedRecords(prevRecords => {
      const updatedRecords = prevRecords.map(record => {
        if (record.transactionId === id) {
          return { ...record, status };
        }
        return record;
      });
      localStorage.setItem('submittedRecords', JSON.stringify(updatedRecords));
      return updatedRecords;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const {
      borrowerName,
      loanAmount,
      loanStartDate,
      maturityDate,
      loanStatus,
      assetRecords,
      balanceSheet,
      existingLiabilities
    } = formData;

    const isBlank = (s) => !s || !String(s).trim();
    // Robust cross-browser date validation: accept ISO or any parseable date
    const isValidDate = (s) => {
      if (isBlank(s)) return false;
      const str = String(s).trim();
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(str);
      const parsed = new Date(str);
      return iso || !Number.isNaN(parsed.getTime());
    };

    if (isBlank(borrowerName) || isBlank(loanAmount) || !isValidDate(loanStartDate) || isBlank(loanStatus)) {
      alert('Please fill in all required fields (Borrower, Amount, Start Date, Status).');
      return;
    }

    const newRecord = {
      borrowerName: String(borrowerName).trim(),
      loanAmount: String(loanAmount).trim(),
      loanStartDate,
      maturityDate,
      loanStatus,
      assetRecords,
      balanceSheet,
      existingLiabilities,
      transactionId: `TXN${Date.now()}`,
      status: 'pending'
    };

    const updatedRecords = [...submittedRecords, newRecord];
    setSubmittedRecords(updatedRecords);
    localStorage.setItem('submittedRecords', JSON.stringify(updatedRecords));

    setFormData({
      borrowerName: '',
      loanAmount: '',
      loanStartDate: '',
      maturityDate: '',
      loanStatus: '',
      assetRecords: '',
      balanceSheet: '',
      existingLiabilities: ''
    });

    setActiveTab('records');
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    try {
      if (!selectedFile) {
        alert('Please choose a document file');
        return;
      }
      setIsUploading(true);
      setUploadResponse(null);
      const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
      const owner = loggedInUser?.email || 'unknown-owner';
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('owner', owner);
      if (loanIdForUpload) form.append('loanId', loanIdForUpload);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      setUploadResponse(data);
      alert('Document uploaded for verification');
      setSelectedFile(null);
      setLoanIdForUpload('');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const loadMyDocs = async (email) => {
    try {
      setLoadingDocs(true);
      const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
      const owner = email || loggedInUser?.email;
      if (!owner) return;
      const res = await fetch(`/api/documents?owner=${encodeURIComponent(owner)}`);
      const data = await res.json();
      setMyDocs(Array.isArray(data) ? data : []);
    } catch (_) {
      setMyDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  return (
    <div className="font-inter bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md p-4 sticky top-0 z-50 flex justify-between items-center">
        <div>
          <h1 className="text-blue-800 font-bold text-xl">Creditor Dashboard</h1>
          <p className="text-gray-600">HDFC Bank Ltd - Manage loan records and track verification status</p>
        </div>
        <button
          id="logoutBtn"
          onClick={logout}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
        <div className="card bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-blue-800 font-bold mb-2">Total Submissions</h2>
          <div className="text-3xl font-bold text-blue-600">{submittedRecords.length}</div>
        </div>
        <div className="card bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-blue-800 font-bold mb-2">Pending Confirmation</h2>
          <div className="text-3xl font-bold text-yellow-600">
            {submittedRecords.filter(r => r.status === 'pending').length}
          </div>
        </div>
        <div className="card bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-blue-800 font-bold mb-2">Confirmed Records</h2>
          <div className="text-3xl font-bold text-green-600">
            {submittedRecords.filter(r => r.status === 'confirmed').length}
          </div>
        </div>
        <div className="card bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-blue-800 font-bold mb-2">Total Exposure</h2>
          <div className="text-3xl font-bold text-blue-600">₹2.4K Cr</div>
        </div>
      </div>

      <div className="tabs flex justify-center gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
          onClick={() => switchTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'smart' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
          onClick={() => switchTab('smart')}
        >
          Smart Contract
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'records' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
          onClick={() => switchTab('records')}
        >
          Submitted Records
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="section p-6">
          <div className="panel bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
            {submittedRecords.slice(-3).reverse().map((record) => (
              <div key={record.transactionId} className="loan-item flex justify-between items-center border border-gray-200 rounded-lg p-4 mb-2">
                <div>
                  {record.borrowerName}<br />
                  <span className={`status ${record.status}`}>{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="panel bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">Pending Actions</h3>
            <div className="loan-item border border-gray-200 rounded-lg p-4 mb-2">
              Loan Expiring Soon<br />
              <small>Reliance Capital - Due in 3 days</small>
            </div>
            <div className="loan-item border border-gray-200 rounded-lg p-4">
              Monthly Report Ready<br />
              <small>December 2024 compliance report</small>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'smart' && (
        <div className="section p-6">
          <div className="panel bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">+ Submit New Loan Record</h3>
            <p className="mb-4">Record new loan and financial data on the blockchain for borrower verification</p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group mb-4">
                <label>Borrower Name *</label>
                <input
                  type="text"
                  name="borrowerName"
                  placeholder="e.g., Reliance Capital Ltd"
                  value={formData.borrowerName}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label>Loan Amount *</label>
                <input
                  type="text"
                  name="loanAmount"
                  placeholder="e.g., ₹500 Crore"
                  value={formData.loanAmount}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label>Loan Start Date *</label>
                <input
                  type="date"
                  name="loanStartDate"
                  value={formData.loanStartDate}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label>Maturity Date</label>
                <input
                  type="date"
                  name="maturityDate"
                  value={formData.maturityDate}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="form-group mb-4">
                <label>Current Loan Status</label>
                <select
                  name="loanStatus"
                  value={formData.loanStatus}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  <option value="">Select loan status</option>
                  <option value="Active">Active</option>
                  <option value="Defaulted">Defaulted</option>
                </select>
              </div>
              <div className="form-group mb-4">
                <label>Asset Records</label>
                <textarea
                  name="assetRecords"
                  placeholder="Describe assets, collateral, etc."
                  value={formData.assetRecords}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="form-group mb-4">
                <label>Balance Sheet Summary</label>
                <textarea
                  name="balanceSheet"
                  placeholder="Total assets, liabilities, equity details..."
                  value={formData.balanceSheet}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="form-group mb-4">
                <label>Existing Liabilities</label>
                <textarea
                  name="existingLiabilities"
                  placeholder="Other outstanding loans, obligations..."
                  value={formData.existingLiabilities}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="form-buttons flex justify-end gap-4">
                <button type="button" className="btn-draft bg-gray-300 text-gray-700 rounded-lg px-4 py-2" onClick={() => alert('Draft saved!')}>
                  Save as Draft
                </button>
                <button type="submit" className="btn-submit bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
                  Submit to Blockchain
                </button>
              </div>
            </form>
          </div>

          <div className="panel bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="font-bold text-lg mb-4">+ Upload Supporting Documents</h3>
            <p className="mb-4">Upload loan-related documents for admin verification. Hash will be anchored on-chain after approval.</p>
            <form onSubmit={handleDocumentUpload} className="space-y-4" noValidate>
              <div>
                <label className="block mb-1">Loan ID (optional)</label>
                <input
                  type="text"
                  value={loanIdForUpload}
                  onChange={(e) => setLoanIdForUpload(e.target.value)}
                  placeholder="e.g., LOAN001"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-1">Select Document (optional)</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="submit" disabled={isUploading} className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
                  {isUploading ? 'Uploading...' : 'Upload for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="section p-6">
          <div className="panel bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">Submitted Loan Records</h3>
            <p className="mb-4">Track status of all your submitted loan records</p>
            {submittedRecords.map(record => (
              <div key={record.transactionId} className="loan-item flex justify-between items-center border border-gray-200 rounded-lg p-4 mb-2" data-status={record.status}>
                <div>
                  <strong>{record.borrowerName}</strong><br />
                  Transaction ID: {record.transactionId}<br />
                  Amount <strong>{record.loanAmount}</strong><br />
                  Submitted <strong>{record.loanStartDate}</strong><br />
                  {record.status === 'confirmed' ? (
                    <>Confirmed <strong>{record.maturityDate}</strong></>
                  ) : (
                    <>Expires <strong>{record.maturityDate}</strong></>
                  )}
                </div>
                <div className="status-and-actions flex items-center gap-4">
                  <div className="status-dropdown-container relative inline-block">
                    <button
                      className="status-dropdown-toggle bg-gray-200 text-gray-700 border border-gray-300 rounded-lg px-3 py-1 font-semibold text-sm flex items-center justify-between min-w-[150px]"
                      onClick={() => handleDropdownToggle(record.transactionId)}
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)} ▼
                    </button>
                    {dropdownStatus[record.transactionId] && (
                      <div className="status-dropdown-menu absolute top-full left-0 bg-white border border-gray-300 rounded-b-lg shadow-md z-10 w-full">
                        <div
                          className="dropdown-item px-4 py-2 cursor-pointer hover:bg-gray-100 font-semibold text-sm"
                          onClick={() => handleDropdownSelect(record.transactionId, 'default')}
                        >
                          Default
                        </div>
                        <div
                          className="dropdown-item px-4 py-2 cursor-pointer hover:bg-gray-100 font-semibold text-sm"
                          onClick={() => handleDropdownSelect(record.transactionId, 'npa')}
                        >
                          Non-Performing Asset (NPA)
                        </div>
                        <div
                          className="dropdown-item px-4 py-2 cursor-pointer hover:bg-gray-100 font-semibold text-sm"
                          onClick={() => handleDropdownSelect(record.transactionId, 'pending')}
                        >
                          Pending Confirmation
                        </div>
                        <div
                          className="dropdown-item px-4 py-2 cursor-pointer hover:bg-gray-100 font-semibold text-sm"
                          onClick={() => handleDropdownSelect(record.transactionId, 'confirmed')}
                        >
                          Confirmed
                        </div>
                      </div>
                    )}
                  </div>
                  <button className="view-details-btn bg-blue-600 text-white rounded-lg px-3 py-1 font-semibold hover:bg-blue-700">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="panel bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">My Documents</h3>
              <button onClick={() => loadMyDocs()} className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">
                {loadingDocs ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <p className="mb-4">Documents you uploaded. Admin will verify and anchor their hashes on-chain.</p>
            <div className="overflow-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-blue-100 text-blue-800">
                  <tr>
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">Filename</th>
                    <th className="p-2 text-left">Loan ID</th>
                    <th className="p-2 text-left">Size</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myDocs.map((d) => (
                    <tr key={d.id} className="border-b border-gray-200">
                      <td className="p-2">{d.id}</td>
                      <td className="p-2">{d.filename}</td>
                      <td className="p-2">{d.loan_id || '-'}</td>
                      <td className="p-2">{Math.round(d.size_bytes / 1024)} KB</td>
                      <td className="p-2">
                        {d.verified ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">Verified</span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">Pending</span>
                        )}
                      </td>
                      <td className="p-2">
                        <a
                          href={`/api/documents/${encodeURIComponent(d.id)}/download`}
                          className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                  {!myDocs.length && (
                    <tr>
                      <td className="p-3 text-center text-gray-500" colSpan={6}>No documents uploaded yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
